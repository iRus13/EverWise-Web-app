import React from 'react';
import {act, cleanup, render} from '@testing-library/react';
import {afterEach, expect, test, vi} from 'vitest';
import {hasOwn} from '../src/utils/hasOwn.js';
import BackButton from '../src/components/BackButton.jsx';
import {setLocale,translate} from '../src/i18n/index.js';
import {learningText} from '../src/i18n/learning.js';
import {isValidEmail} from '../src/utils/validation.js';
import {courseStanding} from '../src/utils/courseProgress.js';
import {pathOrderForPhase} from '../src/data/course-catalog.js';
import {readLessonPosition, saveLessonPosition, clearLessonPosition} from '../src/utils/lessonProgress.js';
import {readAssessmentPosition, saveAssessmentPosition} from '../src/utils/assessmentProgress.js';
import useViewportHeight from '../src/hooks/useViewportHeight.js';
import AppShell from '../src/components/AppShell.jsx';

function withoutModernCollections(run) {
  const own = Object.getOwnPropertyDescriptor(Object, 'hasOwn');
  const at = Object.getOwnPropertyDescriptor(Array.prototype, 'at');
  try {
    Object.defineProperty(Object, 'hasOwn', {...own, value: undefined});
    Object.defineProperty(Array.prototype, 'at', {...at, value: undefined});
    return run();
  } finally {
    Object.defineProperty(Object, 'hasOwn', own);
    Object.defineProperty(Array.prototype, 'at', at);
  }
}
function memoryStorage() {
  const data = new Map();
  return {getItem: key => data.get(key) ?? null, setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
}
afterEach(()=>{cleanup();setLocale('en');vi.unstubAllGlobals();vi.restoreAllMocks();document.documentElement.style.removeProperty('--app-viewport-height');});

test('own-property checks keep inherited, shadowed and null-prototype input distinct without modern APIs',()=>{
  const inherited=Object.create({paid:true});inherited.name='Learner';
  const bare=Object.assign(Object.create(null),{hasOwnProperty:false,paid:undefined});
  const result=withoutModernCollections(()=>[hasOwn(inherited,'paid'),hasOwn(inherited,'name'),hasOwn(bare,'paid'),hasOwn(bare,'toString'),hasOwn(bare,'hasOwnProperty')]);
  expect(result).toEqual([false,true,true,false,true]);
});

test('Spanish UI, interpolation and lesson text render without Object.hasOwn',()=>{
  const inherited=Object.create({name:'inherited'});
  const result=withoutModernCollections(()=>[translate('Settings','es'),translate('Hello {name}','es',{name:'Ana'}),translate('Hello {name}','es',inherited),learningText('What Can You Conclude?','es')]);
  expect(result).toEqual(['Ajustes','Hello Ana','Hello {name}','¿Qué puedes concluir?']);
});

test('email validation and final course position work without Array.at',()=>{
  const curriculum={lessons:[{id:'a',phase:1}],challenges:[],exams:[]};
  const result=withoutModernCollections(()=>[isValidEmail('learner@example.com'),isValidEmail('learner@example.c'),pathOrderForPhase(1),pathOrderForPhase(999),courseStanding(['a'],['a'],curriculum)]);
  expect(result.slice(0,4)).toEqual([true,false,8,-1]);
  expect(result[4]).toMatchObject({isComplete:true,currentPhase:1,percent:100});
});

test('lesson and assessment resume stay scoped to the learner without modern collection methods',()=>{
  const storage=memoryStorage(),lesson={phase:'quiz',blockIndex:3,quizIndex:2,score:1},assessment={kind:'challenge',revision:'123:456',blockIndex:2,finished:false};
  const result=withoutModernCollections(()=>{
    saveLessonPosition({uid:'a',lessonId:'internet',position:lesson,storage});
    saveAssessmentPosition({uid:'a',itemId:'practice',position:assessment,storage});
    const saved=[readLessonPosition({uid:'a',lessonId:'internet',storage}),readAssessmentPosition({uid:'a',itemId:'practice',storage}),readLessonPosition({uid:'b',lessonId:'internet',storage}),readAssessmentPosition({uid:'b',itemId:'practice',storage})];
    clearLessonPosition({uid:'a',lessonId:'internet',storage});
    return [...saved,readLessonPosition({uid:'a',lessonId:'internet',storage})];
  });
  expect(result).toEqual([{...lesson,reviewQueue:[]},assessment,null,null,null]);
});

function HeightProbe(){useViewportHeight();return <div>Viewport</div>;}
test('fallback tracks visible height changes and restores a prior value on unmount',()=>{
  vi.stubGlobal('CSS',{supports:()=>false});vi.stubGlobal('innerHeight',620);
  document.documentElement.style.setProperty('--app-viewport-height','700px');
  const view=render(<HeightProbe/>);expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('620px');
  vi.stubGlobal('innerHeight',420);act(()=>window.dispatchEvent(new Event('resize')));
  expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('420px');
  view.unmount();expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('700px');
  vi.stubGlobal('innerHeight',500);act(()=>window.dispatchEvent(new Event('resize')));
  expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('700px');
});
test('modern dynamic viewport support remains controlled by CSS',()=>{
  vi.stubGlobal('CSS',{supports:(property,value)=>property==='height' && value==='100dvh'});
  render(<HeightProbe/>);act(()=>window.dispatchEvent(new Event('resize')));
  expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('');
});
test('invalid fallback heights cannot collapse the viewport',()=>{
  vi.stubGlobal('CSS',{supports:()=>false});vi.stubGlobal('innerHeight',667);render(<HeightProbe/>);
  vi.stubGlobal('innerHeight',0);act(()=>window.dispatchEvent(new Event('resize')));
  expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('667px');
});
test('shell declares navigation ownership without requiring CSS parent selection',()=>{
  const view=render(<AppShell screen="settings" isAuthenticated><h1>Settings</h1></AppShell>);
  expect(view.container.querySelector('.app-viewport')).toHaveClass('has-primary-navigation');
  view.rerender(<AppShell screen="lesson" isAuthenticated><h1>Lesson</h1></AppShell>);
  expect(view.container.querySelector('.app-viewport')).not.toHaveClass('has-primary-navigation');
});

test('entry-flow Back control follows a language change for visible and spoken labels',()=>{
  const view=render(<BackButton/>);expect(view.getByRole('button',{name:'Back',exact:true})).toBeVisible();
  act(()=>setLocale('es'));expect(view.getByRole('button',{name:'Atrás',exact:true})).toHaveTextContent('Atrás');
});
