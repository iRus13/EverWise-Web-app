import React from 'react';
import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import ExamPlayer from '../src/screens/ExamPlayer.jsx';
import ChallengePlayer from '../src/screens/ChallengePlayer.jsx';
import {assessmentRevision} from '../src/utils/assessmentProgress.js';
vi.mock('../src/components/ReadAloud',()=>({default:()=>null}));
Element.prototype.scrollTo=()=>{};
afterEach(cleanup);
const exam={title:'Safety exam',topics:['Safety'],passingScore:2,questions:[{question:'First?',options:['A','B'],correctIndex:0},{question:'Second?',options:['C','D'],correctIndex:1}],results:[{title:'Safety award',minScore:2}]};
const click=name=>fireEvent.click(screen.getByRole('button',{name,exact:true}));

test('exam resumes the current choice after unmount, permits changes and derives the final score',()=>{
 let saved;const change=p=>{saved=p},pass=vi.fn();
 const first=render(<ExamPlayer exam={exam} onPositionChange={change}/>);
 click('Start exam');click('A');click('Next');click('C');
 expect(saved.answers).toEqual([0]);expect(saved.selected).toBe(0);
 first.unmount();
 render(<ExamPlayer exam={exam} initialPosition={saved} onPositionChange={change} onPass={pass}/>);
 expect(screen.getByRole('heading',{name:'Second?'})).toHaveFocus();
 expect(screen.getByRole('button',{name:'C'})).toHaveAttribute('aria-pressed','true');
 click('D');click('See results');
 expect(screen.getByText('You scored 2 of 2.')).toBeVisible();
 expect(saved).toMatchObject({phase:'results',answers:[0,1],selected:null});
 expect(pass).not.toHaveBeenCalled();
 cleanup();render(<ExamPlayer exam={exam} initialPosition={saved} onPass={pass}/>);
 expect(screen.getByText('You scored 2 of 2.')).toBeVisible();
 click('Back to your path');expect(pass).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({score:2}));
});
test('a restored failed result can be retried, clearing all previous answers',()=>{
 const change=vi.fn();
 render(<ExamPlayer exam={exam} initialPosition={{kind:'exam',revision:assessmentRevision(exam),phase:'results',answers:[1,null],selected:null}} onPositionChange={change}/>);
 click('Try again');expect(change).toHaveBeenLastCalledWith(null);
 click('Start exam');expect(screen.getByRole('heading',{name:'First?'})).toBeVisible();
 expect(change).toHaveBeenLastCalledWith(expect.objectContaining({answers:[],selected:null}));
});
test('changed authored content starts at the introduction instead of applying stale answers',()=>{
 render(<ExamPlayer exam={{...exam,title:'Revised exam'}} initialPosition={{kind:'exam',revision:assessmentRevision(exam),phase:'quiz',answers:[0],selected:1}}/>);
 expect(screen.getByRole('heading',{name:'Revised exam'})).toBeVisible();
});
test('a challenge resumes its next activity and finished review without awarding early',()=>{
 const challenge={id:'review',title:'Review',blocks:[{type:'learn',heading:'First activity',text:'Read this'},{type:'learn',heading:'Second activity',text:'Read this too'}]};
 let saved;const change=p=>{saved=p},complete=vi.fn();
 const first=render(<ChallengePlayer challenge={challenge} onPositionChange={change}/>);
 click('Continue');expect(saved.blockIndex).toBe(1);first.unmount();
 render(<ChallengePlayer challenge={challenge} initialPosition={saved} onPositionChange={change}/>);
 expect(screen.getByRole('heading',{name:'Second activity'})).toBeVisible();
 click('Continue');expect(saved.finished).toBe(true);cleanup();
 render(<ChallengePlayer challenge={challenge} initialPosition={saved} onComplete={complete}/>);
 expect(complete).not.toHaveBeenCalled();click('Back to your path');expect(complete).toHaveBeenCalledOnce();
});
