import React,{useState} from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,test,vi} from 'vitest';
import Field from '../src/components/Field.jsx';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function Form({submit=()=>{},initial=' padded password ',disabled=false}){const [value,setValue]=useState(initial);return <form onSubmit={e=>{e.preventDefault();submit(value);}}><Field id="secret" label="Password" type="password" value={value} onChange={setValue} autoComplete="current-password" disabled={disabled}/><button type="button">Outside</button><button type="submit">Continue</button></form>;}
test('reveals and conceals the existing password without submitting or changing its value',async()=>{
 const user=userEvent.setup(),submit=vi.fn();render(<Form submit={submit}/>);const field=screen.getByLabelText('Password');expect(field).toHaveAttribute('type','password');field.focus();field.setSelectionRange(2,8);
 await user.click(screen.getByRole('button',{name:'Show password'}));expect(field).toHaveAttribute('type','text');expect(field).toHaveValue(' padded password ');expect(field).toHaveFocus();expect([field.selectionStart,field.selectionEnd]).toEqual([2,8]);expect(field).toHaveAttribute('autocapitalize','none');expect(field).toHaveAttribute('autocorrect','off');expect(field).toHaveAttribute('spellcheck','false');expect(field).toHaveAttribute('autocomplete','current-password');expect(submit).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Hide password'})).toHaveAttribute('aria-controls','secret');
 await user.click(screen.getByRole('button',{name:'Hide password'}));expect(field).toHaveAttribute('type','password');expect(field).toHaveFocus();await user.click(screen.getByRole('button',{name:'Continue'}));expect(submit).toHaveBeenCalledWith(' padded password ');
});
test('keyboard operation reveals the field and leaving the field group conceals it',async()=>{
 const user=userEvent.setup();render(<Form/>);const toggle=screen.getByRole('button',{name:'Show password'});toggle.focus();await user.keyboard(' ');expect(screen.getByLabelText('Password')).toHaveAttribute('type','text');expect(toggle).toHaveFocus();await user.tab();expect(screen.getByLabelText('Password')).toHaveFocus();expect(screen.getByLabelText('Password')).toHaveAttribute('type','text');await user.tab();expect(screen.getByLabelText('Password')).toHaveAttribute('type','password');
});
test('clearing a revealed value restores concealed entry, and a disabled field cannot be revealed',async()=>{
 const user=userEvent.setup();const view=render(<Form/>);await user.click(screen.getByRole('button',{name:'Show password'}));fireEvent.change(screen.getByLabelText('Password'),{target:{value:''}});expect(screen.getByLabelText('Password')).toHaveAttribute('type','password');fireEvent.change(screen.getByLabelText('Password'),{target:{value:'new synthetic password'}});expect(screen.getByLabelText('Password')).toHaveAttribute('type','password');view.rerender(<Form disabled/>);expect(screen.getByRole('button',{name:'Show password'})).toBeDisabled();
});
test('hides a revealed password when the page becomes hidden',async()=>{
 const user=userEvent.setup();render(<Form/>);await user.click(screen.getByRole('button',{name:'Show password'}));vi.spyOn(document,'hidden','get').mockReturnValue(true);fireEvent(document,new Event('visibilitychange'));expect(screen.getByLabelText('Password')).toHaveAttribute('type','password');
});
