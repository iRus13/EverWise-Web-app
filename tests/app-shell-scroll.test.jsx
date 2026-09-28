import React, {useEffect} from 'react';
import {cleanup,render} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import AppShell from '../src/components/AppShell.jsx';

afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
function prepare(){
 vi.stubGlobal('requestAnimationFrame',vi.fn());vi.stubGlobal('cancelAnimationFrame',vi.fn());
 Object.defineProperty(document,'scrollingElement',{configurable:true,value:document.documentElement});
 document.documentElement.scrollTop=0;
}
test('new destinations clear inherited page and canvas scrolling while retaining sidebar position',()=>{
 prepare();const view=render(<AppShell screen="path" isAuthenticated><h1>Your path</h1></AppShell>);
 const main=view.container.querySelector('main'),nav=view.container.querySelector('nav');
 document.scrollingElement.scrollTop=1175;main.scrollTop=90;nav.scrollTop=103;
 view.rerender(<AppShell screen="home" isAuthenticated><h1>Hello</h1></AppShell>);
 expect(document.scrollingElement.scrollTop).toBe(0);expect(main.scrollTop).toBe(0);expect(nav.scrollTop).toBe(103);
 expect(document.activeElement).toHaveTextContent('Hello');
});
test('same-screen updates leave the current reading position alone',()=>{
 prepare();const view=render(<AppShell screen="home"><h1>Hello</h1><p>Loading access</p></AppShell>);
 document.scrollingElement.scrollTop=400;view.container.querySelector('main').scrollTop=30;
 view.rerender(<AppShell screen="home"><h1>Hello</h1><p>Access confirmed</p></AppShell>);
 expect(document.scrollingElement.scrollTop).toBe(400);expect(view.container.querySelector('main').scrollTop).toBe(30);
});
test('the destination can reveal its own current activity after the page reset',()=>{
 prepare();function Course(){useEffect(()=>{document.scrollingElement.scrollTop=900;},[]);return <h1>Your path</h1>;}
 const view=render(<AppShell screen="home"><h1>Hello</h1></AppShell>);document.scrollingElement.scrollTop=400;
 view.rerender(<AppShell screen="path"><Course/></AppShell>);
 expect(document.scrollingElement.scrollTop).toBe(900);
});
