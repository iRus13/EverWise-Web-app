"""Resume the synthetic learner at block 5 and complete using actual native taps."""
import importlib,json,pathlib,subprocess,time
T=importlib.import_module('qa-native-touch').NativeTouch
t=T('D68B4B62-1097-48AF-A089-36CC26E89FCE','journey-iphone','../qa-native-learning')
lesson=json.loads((t.output/'internet-lesson.json').read_text())
subprocess.run(['xcrun','simctl','launch','--terminate-running-process',t.udid,'com.everwise.journeyqa'],check=True)
time.sleep(1)
t.click('View course')
s=t.click('Start lesson: What is the Internet?','multiselect-returned')
assert s['progress']['value']=='5',s['progress']
for i,b in enumerate(lesson['blocks']):
 if i<4:continue
 s=t.snapshot();assert int(s['progress']['value'])==i+1,(i,s['progress'])
 assert not s['errors'],s['errors']
 kind=b['type'];prefix=f'block-{i+1:02d}-{kind}'
 t.capture(prefix+'-entry')
 if kind=='multiselect':
  t.click('Reading a printed newspaper')
  s=t.click('Check',prefix+'-correction')
  assert 'Great job!' not in s['body'] and 'Correct choices:' in s['body']
  t.click('Continue')
 elif kind=='flashcards':
  for index,card in enumerate(b['cards']):
   s=t.snapshot();assert f"Card {index+1} of {len(b['cards'])}" in s['body']
   s=t.click('Show back of card',prefix+f'-{index+1}-back')
   assert card['back'] in s['body']
   t.click('Continue')
 elif kind=='fillblank':
  for index,q in enumerate(b['questions']):
   s=t.click(q['answer'],prefix+f'-{index+1}-answered')
   assert s['heading']==q['text'].replace('______',q['answer'])
   t.click('Next' if index+1<len(b['questions']) else 'Continue')
 elif kind in ['scenario','choice']:
  s=t.click(b['options'][b['correctIndex']],prefix+'-answered')
  if b.get('explanation'):assert b['explanation'] in s['body']
  t.click('Continue')
 elif kind=='truefalse':
  for index,q in enumerate(b['questions']):
   s=t.click('True' if q['answer'] else 'False',prefix+f'-{index+1}-answered')
   if q.get('explanation'):assert q['explanation'] in s['body']
   t.click('Next' if index+1<len(b['questions']) else 'Continue')
 elif kind=='learn':t.click('Continue')
 else:raise AssertionError('Unsupported native journey block '+kind)
 print(f'PASS native authored block {i+1}: {kind}',flush=True)
for i,q in enumerate(lesson['quiz']):
 s=t.snapshot();assert s['heading']==q['question'],s['heading']
 answer=q['options'][(q['correctIndex']+1)%len(q['options']) if i==0 else q['correctIndex']]
 s=t.click(answer,f'quiz-{i+1:02d}-answered')
 assert ('Not quite' if i==0 else "That's right") in s['body']
 t.click('Next' if i+1<len(lesson['quiz']) else 'See results')
 print(f'PASS native quiz question {i+1}',flush=True)
s=t.snapshot();assert 'Second look' in s['body']
assert s['heading']==lesson['quiz'][0]['question']
t.capture('quiz-review-entry')
s=t.click(lesson['quiz'][0]['options'][lesson['quiz'][0]['correctIndex']],'quiz-review-corrected')
s=t.click('Finish lesson','internet-completed')
assert 'Internet Explorer' in s['body'],s['body']
(t.output/'native-lesson-result.json').write_text(json.dumps({'passed':True,'journey':'internet','completedBlocks':14,'quizQuestions':8,'reviewedMistakes':1,'nativeTaps':sum(x['action']=='tap' for x in t.events),'result':s},indent=2))
print('PASS native full Internet lesson and mistake review completed',flush=True)
