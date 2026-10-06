"""Full-screen portrait/landscape-left lab interactions via native Baguette HID."""
import atexit, json, os, pathlib, select, subprocess, time, urllib.request

class NativeTouch:
    def __init__(self, udid, device, output, base='http://127.0.0.1:8914', orientation='portrait'):
        assert base.startswith('http://127.0.0.1:')
        assert orientation in ['portrait','landscape-left'], 'Unsupported HID orientation'
        self.orientation=orientation
        self.udid,self.device,self.base=udid,device,base
        self.output=pathlib.Path(output);self.output.mkdir(parents=True,exist_ok=True)
        self.sequence=0
        self.input_process=None
        atexit.register(self.close)
        log=self.output/"native-actions.json"
        self.events=json.loads(log.read_text()) if log.exists() else []

    def snapshot(self):
        self.sequence+=1
        case=f'touch-{time.time_ns()}-{self.sequence}'
        body=json.dumps({'action':'snapshot','path':'/','caseId':case}).encode()
        req=urllib.request.Request(self.base+'/__qa/command?device='+self.device,data=body,headers={'Content-Type':'application/json'})
        urllib.request.urlopen(req,timeout=5).close()
        deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            with urllib.request.urlopen(self.base+'/__qa/result?key='+self.device+':'+case,timeout=5) as r: result=json.load(r)
            if result is not None:
                observations=self.output/'observations';observations.mkdir(exist_ok=True)
                (observations/(case+'.json')).write_text(json.dumps(result,indent=2))
                return result
            time.sleep(.1)
        raise RuntimeError('No native snapshot reply')

    def close(self):
        if self.input_process is None:return
        self.input_process.stdin.close()
        try:self.input_process.wait(timeout=2)
        except subprocess.TimeoutExpired:self.input_process.terminate();self.input_process.wait(timeout=2)
        self.input_process=None

    def gesture(self, payload):
        if self.input_process is None:
            self.input_process=subprocess.Popen(['/opt/homebrew/bin/baguette','input','--udid',self.udid],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
        self.input_process.stdin.write(json.dumps(payload)+'\n');self.input_process.stdin.flush()
        assert select.select([self.input_process.stdout],[],[],10)[0], 'Native input acknowledgment timed out'
        reply=json.loads(self.input_process.stdout.readline())
        assert reply.get('ok') is True,reply

    def hid(self, command, args):
        if command in ['tap','swipe']:
            values={str(args[i]).removeprefix('--'):args[i+1] for i in range(0,len(args),2)}
            if self.orientation == 'landscape-left':
                width,height=values['width'],values['height']
                if command=='tap':
                    values['x'],values['y']=values['y'],width-values['x']
                else:
                    for edge in ['start','end']:
                        values[edge+'-x'],values[edge+'-y']=values[edge+'-y'],width-values[edge+'-x']
                values['width'],values['height']=height,width
            if command=='tap':
                point={key:values[key] for key in ['x','y','width','height']}
                self.gesture({'type':'touch1-down',**point})
                time.sleep(float(values.get('duration',.15)))
                self.gesture({'type':'touch1-up',**point})
            else:
                self.gesture({'type':'swipe',**{key.replace('-x','X').replace('-y','Y'):value for key,value in values.items()}})
            return
        subprocess.run(['/opt/homebrew/bin/baguette',command,'--udid',self.udid]+list(map(str,args)),check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

    def capture(self, name):
        subprocess.run(['xcrun','simctl','io',self.udid,'screenshot',str(self.output/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

    def click(self, label, capture=None):
        for attempt in range(24):
            state=self.snapshot()
            screen_width,screen_height=state['screenWidth'],state['screenHeight']
            assert screen_width <= screen_height, "Expected natural portrait screen dimensions"
            if self.orientation == "landscape-left": screen_width,screen_height=screen_height,screen_width
            assert state['width'] == screen_width, "This HID driver requires a full-width native window"
            matches=[c for c in state['controls'] if c['label']==label]
            if len(matches)!=1:raise AssertionError(f'{state["heading"]}: expected one {label!r}, got {len(matches)}')
            c=matches[0]
            assert not c['disabled'],f'{label!r} disabled'
            x=c['x']+c['width']/2;y=c['y']+c['height']/2
            # Stay clear of system edge gestures even when the WebView reports
            # content beneath the home indicator as geometrically visible.
            b={**c['clip'],'top':max(44,c['clip']['top']),'bottom':min(state['height']-44,c['clip']['bottom'])}
            if c['visible'] and b['left']<=x<=b['right'] and b['top']<=y<=b['bottom']:
                # Native scroll deceleration can continue after the swipe is
                # acknowledged. Observe a stable target before sending a tap.
                time.sleep(.15)
                observed=self.snapshot()
                updated=[item for item in observed['controls'] if item['label']==label]
                if len(updated)!=1 or any(abs(updated[0][axis]-c[axis])>1 for axis in ['x','y','width','height']):
                    continue
                # Keyboard resizing changes the WebView viewport, not the HID
                # coordinate surface. Normalize touches against the full screen.
                tap_args=['--x',x,'--y',y,'--width',screen_width,'--height',screen_height,'--duration',.15]
                self.hid('tap',tap_args)
                self.events.append({'action':'tap','label':label,'heading':state['heading'],'x':x,'y':y,'width':screen_width,'height':screen_height,'viewportHeight':state['height'],'orientation':self.orientation})
                (self.output/'native-actions.json').write_text(json.dumps(self.events,indent=2))
                time.sleep(.3)
                after=self.snapshot()
                if capture:self.capture(capture)
                return after
            # Use a real swipe in the clipped pane, away from central controls.
            top=max(90,b['top']+30);bottom=min(state['height']-90,b['bottom']-30)
            assert bottom-top>70, f'No usable scroll region for {label!r}: {b}'
            # Shorten swipes near the target to avoid repeatedly overshooting
            # a large button above/below the viewport during deceleration.
            distance=min(bottom-top,max(60,abs(y-max(top+30,min(bottom-30,y)))*.5))
            start,end=(bottom,bottom-distance) if y>b['bottom'] else (top,top+distance)
            self.hid('swipe',['--start-x',min(state['width']-12,b['right']-8),'--start-y',start,'--end-x',min(state['width']-12,b['right']-8),'--end-y',end,'--width',screen_width,'--height',screen_height,'--duration',.8])
            self.events.append({'action':'swipe','target':label,'from':start,'to':end})
            time.sleep(.8)
        raise AssertionError('Could not reveal '+label)

if __name__=='__main__':
    import sys
    t=NativeTouch('D68B4B62-1097-48AF-A089-36CC26E89FCE','journey-iphone','../qa-native-learning')
    if len(sys.argv)>1:s=t.click(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else None)
    else:s=t.snapshot()
    print(json.dumps({'heading':s['heading'],'progress':s['progress'],'body':s['body'][:4000],'controls':[{k:c[k] for k in ['label','disabled','visible']} for c in s['controls']],'errors':s['errors']},indent=2))
