import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  fireEvent.change(screen.getByLabelText('Username or email'),{target:{value:'qa-test'}});
  expect(screen.queryByRole('alert')).toBeNull();
});
