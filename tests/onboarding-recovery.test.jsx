import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ProfileInterview from '../src/screens/ProfileInterview.jsx';
import LogIn from '../src/screens/LogIn.jsx';
await vi.hoisted(async () => { globalThis.React = (await import('react')).default; });
vi.mock('../src/components/ReadAloud', () => ({default: () => null}));
afterEach(cleanup);

test('onboarding errors sit beside the action and clear when input changes', () => {
  render(<ProfileInterview onBack={vi.fn()} onComplete={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', {name:'Start'}));
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('Please enter your name.');
  expect(alert.closest('footer')).not.toBeNull();
  expect(screen.getByLabelText('What should we call you?')).toHaveFocus();
  expect(screen.getByLabelText('What should we call you?')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('What should we call you?')).toHaveAccessibleDescription('Please enter your name.');
  fireEvent.change(screen.getByLabelText('What should we call you?'), {target:{value:'QA Test'}});
  expect(screen.queryByRole('alert')).toBeNull();
});

test('login detour carries answers but never the entered password', () => {
  const onLogIn = vi.fn();
  const initial = {name:'QA Test',age:65,concerns:['Suspicious links'],username:'qa-test'};
  const {unmount} = render(<ProfileInterview initialInterview={initial} onLogIn={onLogIn} />);
  fireEvent.change(screen.getByLabelText('Choose a password'), {target:{value:'fixture-only'}});
  fireEvent.click(screen.getByRole('button', {name:'Log in'}));
  const draft = onLogIn.mock.calls[0][0];
  expect(draft).toMatchObject({name:'QA Test',age:'65',concerns:['Suspicious links']});
  expect(draft).not.toHaveProperty('password');
  unmount();
  render(<ProfileInterview initialInterview={draft} />);
  expect(screen.getByRole('heading')).toHaveTextContent('Save your personal plan');
  expect(screen.getByLabelText('Choose a password')).toHaveValue('');
  fireEvent.click(screen.getByRole('button',{name:'Previous question'}));
  for(let i=0;i<6;i++) fireEvent.click(screen.getByRole('button',{name:'Previous question'}));
  expect(screen.getByLabelText('What should we call you?')).toHaveValue('QA Test');
  expect(screen.getByLabelText('Your age')).toHaveValue(65);
});

test('login missing-field error clears when the identifier is corrected', () => {
  render(<LogIn onLogIn={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:'Log In'}));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByLabelText('Username or email')).toHaveFocus();
  expect(screen.getByLabelText('Username or email')).toHaveAttribute('aria-invalid','true');
  fireEvent.change(screen.getByLabelText('Username or email'),{target:{value:'qa-test'}});
  expect(screen.queryByRole('alert')).toBeNull();
});

test('login ignores repeated form submissions while a request is pending and can retry after failure', async () => {
  let reject;
  const onLogIn = vi.fn().mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; })).mockResolvedValue();
  const {container} = render(<LogIn onLogIn={onLogIn} />);
  fireEvent.change(screen.getByLabelText('Username or email'),{target:{value:'qa-test'}});
  fireEvent.change(screen.getByLabelText('Password'),{target:{value:'local-test-only'}});
  fireEvent.submit(container.querySelector('form'));
  fireEvent.submit(container.querySelector('form'));
  expect(onLogIn).toHaveBeenCalledTimes(1);
  await act(async () => reject({code:'auth/network-request-failed'}));
  expect(screen.getByRole('button',{name:'Log In'})).toBeEnabled();
  await act(async () => fireEvent.submit(container.querySelector('form')));
  expect(onLogIn).toHaveBeenCalledTimes(2);
});

test.each(['      ', ' padded secret '])('login passes a whitespace-containing password unchanged: %j', async password => {
  const onLogIn = vi.fn().mockResolvedValue();
  render(<LogIn onLogIn={onLogIn} />);
  fireEvent.change(screen.getByLabelText('Username or email'), {target:{value:' qa-test '}});
  fireEvent.change(screen.getByLabelText('Password'), {target:{value:password}});
  await act(async () => fireEvent.click(screen.getByRole('button',{name:'Log In'})));
  expect(onLogIn).toHaveBeenCalledExactlyOnceWith('qa-test', password);
  expect(screen.queryByRole('alert')).toBeNull();
});

function startInterview() {
  render(<ProfileInterview onBack={vi.fn()} onComplete={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('What should we call you?'), {target:{value:'QA Test'}});
  fireEvent.change(screen.getByLabelText('Your age'), {target:{value:'68'}});
  fireEvent.click(screen.getByRole('button', {name:'Start'}));
}

test('onboarding focuses invalid age, keeps the name, and clears invalid state on correction', () => {
  render(<ProfileInterview onBack={vi.fn()} onComplete={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('What should we call you?'), {target:{value:'QA Test'}});
  fireEvent.change(screen.getByLabelText('Your age'), {target:{value:'17'}});
  fireEvent.click(screen.getByRole('button', {name:'Start'}));
  expect(screen.getByLabelText('Your age')).toHaveFocus();
  expect(screen.getByLabelText('Your age')).toHaveAccessibleDescription('Please enter an age between 18 and 120.');
  expect(screen.getByLabelText('What should we call you?')).toHaveValue('QA Test');
  fireEvent.change(screen.getByLabelText('Your age'), {target:{value:'68'}});
  expect(screen.getByLabelText('Your age')).not.toHaveAttribute('aria-invalid');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('onboarding focuses the first missing group without selecting an answer', () => {
  startInterview();
  fireEvent.click(screen.getByRole('button', {name:'Continue'}));
  expect(screen.getByRole('radio', {name:'Every day'})).toHaveFocus();
  expect(screen.getByRole('radio', {name:'Every day'})).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(screen.getByRole('radio', {name:'Every day'}));
  fireEvent.click(screen.getByRole('button', {name:'Continue'}));
  expect(screen.getByRole('radio', {name:'Smartphone'})).toHaveFocus();
  expect(screen.getByRole('radiogroup', {name:'Which device do you use most?'})).toHaveAccessibleDescription('Please choose one answer for both questions.');
  expect(screen.getByRole('radio', {name:'Every day'})).toHaveAttribute('aria-checked', 'true');
});

test.each([
  [1, 'radio', 'Confident'],
  [2, 'checkbox', 'Scam calls and messages'],
  [3, 'radio', 'Open the link'],
  [4, 'radio', 'Yes, regularly'],
  [5, 'radio', 'Yes'],
])('missing answer on later question %i receives focus and can still be skipped', (skips, role, name) => {
  startInterview();
  for (let i=0;i<skips;i++) fireEvent.click(screen.getByRole('button', {name:'Skip', exact:true}));
  fireEvent.click(screen.getByRole('button', {name:'Continue'}));
  expect(screen.getByRole(role, {name, exact:true})).toHaveFocus();
  expect(screen.getByRole(role, {name, exact:true})).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(screen.getByRole('button', {name:'Skip', exact:true}));
  expect(screen.queryByRole('alert')).toBeNull();
});

test('research choice focuses an answer but never defaults consent', () => {
  render(<ProfileInterview partner={{name:'QA Partner'}} initialInterview={{name:'QA Test', age:68}} />);
  fireEvent.click(screen.getByRole('button', {name:'Previous question'}));
  fireEvent.click(screen.getByRole('button', {name:'Continue'}));
  const yes = screen.getByRole('radio', {name:'Yes, share a minimized copy to improve EverWise'});
  expect(yes).toHaveFocus();
  expect(yes).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Please choose Yes or No before continuing.');
  fireEvent.click(screen.getByRole('radio', {name:'No, use my answers only for my personal plan'}));
  fireEvent.click(screen.getByRole('button', {name:'Continue'}));
  expect(screen.getByRole('heading')).toHaveTextContent('Save your personal plan');
});

test.each([false, true])('signup directs correction to the identifier and then password (sponsored=%s)', sponsored => {
  const onComplete = vi.fn();
  render(<ProfileInterview partner={sponsored ? {name:'QA Partner'} : null} initialInterview={{name:'QA Test',age:68}} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', {name:'Build my plan'}));
  const identifier = screen.getByLabelText(sponsored ? 'Email' : 'Username');
  expect(identifier).toHaveFocus();
  expect(identifier).toHaveAttribute('aria-invalid', 'true');
  fireEvent.change(identifier, {target:{value:sponsored ? 'qa@example.test' : 'qa_test'}});
  fireEvent.click(screen.getByRole('button', {name:'Build my plan'}));
  expect(screen.getByLabelText('Choose a password')).toHaveFocus();
  expect(screen.getByLabelText('Choose a password')).toHaveAccessibleDescription('Please choose a password with at least 6 characters.');
  expect(onComplete).not.toHaveBeenCalled();
});
