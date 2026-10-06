import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
await vi.hoisted(async () => { globalThis.React = (await import('react')).default; });
import { setLocale, tr } from '../src/i18n';
import LanguageSelect from '../src/components/LanguageSelect';
import Landing from '../src/screens/Landing';
import LogIn from '../src/screens/LogIn';
import Paywall from '../src/screens/Paywall';
import Badges from '../src/screens/Badges';
import { badgeCatalog } from '../src/utils/badges';
afterEach(() => { cleanup(); act(() => setLocale('en')); localStorage.clear(); });

test('Spanish is selectable, persisted, and updates document language', () => {
  render(<Landing />);
  fireEvent.change(screen.getByRole('combobox', {name: 'Language'}), {target:{value:'es'}});
  expect(screen.getByRole('button', {name:'Empezar'})).toBeVisible();
  expect(screen.getByText('Lecciones breves, con palabras sencillas.')).toBeVisible();
  expect(localStorage.getItem('everwise.language')).toBe('es');
  expect(document.documentElement.lang).toBe('es');
  expect(screen.getByRole('status')).toHaveTextContent('Las demás lecciones y los resultados de IA siguen en inglés.');
  act(() => setLocale('unsupported'));
  expect(document.documentElement.lang).toBe('es');
  expect(tr('Untranslated text')).toBe('Untranslated text');
});

test('switching language preserves account form values and canonical submission', async () => {
  const onSubmit = vi.fn();
  render(<LogIn onLogIn={onSubmit} />);
  fireEvent.change(screen.getByLabelText('Username or email'), {target:{value:'qa@example.com'}});
  fireEvent.change(screen.getByLabelText('Password', {exact:true}), {target:{value:'synthetic-test'}});
  fireEvent.change(screen.getByRole('combobox'), {target:{value:'es'}});
  expect(screen.getByLabelText('Usuario o correo electrónico')).toHaveValue('qa@example.com');
  expect(screen.getByLabelText('Contraseña', {exact:true})).toHaveValue('synthetic-test');
  await act(async () => fireEvent.click(screen.getByRole('button', {name:'Iniciar sesión', exact:true})));
  expect(onSubmit).toHaveBeenCalledWith('qa@example.com', 'synthetic-test');
});

test('Spanish subscription labels preserve Apple prices and plan selection', () => {
  setLocale('es');
  render(<Paywall storeProducts={['annual','monthly'].map(key => ({
    id:`com.everwise.app.${key}`, displayPrice:key==='annual'?'€89,99':'€14,99',
    periodUnit:key==='annual'?'year':'month',periodValue:1,eligibleForTrial:false,
  }))} />);
  expect(screen.getByRole('heading',{name:'Elige tu plan'})).toBeVisible();
  expect(screen.getByRole('radio',{name:/Anual/})).toHaveTextContent('€89,99/año');
  fireEvent.click(screen.getByRole('radio',{name:/Mensual/}));
  expect(screen.getByRole('button',{name:'Continuar con el plan mensual'})).toBeVisible();
});

test('storage updates synchronize existing language selectors', () => {
  render(<LanguageSelect />);
  localStorage.setItem('everwise.language','es');
  act(() => window.dispatchEvent(new StorageEvent('storage',{key:'everwise.language',newValue:'es'})));
  expect(screen.getByRole('combobox',{name:'Idioma'})).toHaveValue('es');
});

test('badge filters and counts translate without changing saved award identities', () => {
  const catalog = badgeCatalog();
  const savedName = catalog[0].badges[0].name;
  render(<Badges badges={[savedName, 'Saved exam honor']} />);
  act(() => setLocale('es'));
  expect(screen.getByRole('heading', {name:'Tus insignias'})).toBeVisible();
  expect(screen.getByRole('progressbar', {name:'Insignias del curso obtenidas'})).toHaveAttribute('aria-valuenow','1');
  expect(screen.getByRole('button', {name:'Obtenidas',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByRole('heading', {name:savedName,exact:true})).toHaveAttribute('lang','en');
  expect(screen.getByRole('heading', {name:'Saved exam honor'})).toBeVisible();
  expect(screen.getByText('Resultado del examen')).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name:'Todas',exact:true}));
  const phase = screen.getByRole('button', {name:'Etapa 1: Fundamentos'});
  fireEvent.click(phase);
  expect(phase).toHaveAttribute('aria-expanded','true');
  expect(screen.getByRole('heading', {name:catalog[0].badges[1].name,exact:true})).toBeVisible();
  act(() => setLocale('en'));
  expect(screen.getByRole('button', {name:'Phase 1: Foundations'})).toHaveAttribute('aria-expanded','true');
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
});

test('new learners get a translated empty state and an honest course-language notice', () => {
  setLocale('es');
  render(<Badges badges={[]} />);
  fireEvent.click(screen.getByRole('button', {name:'Obtenidas',exact:true}));
  expect(screen.getByRole('status')).toHaveTextContent('Completa tu primera lección');
  expect(screen.getByText('Algunos títulos del curso y nombres de insignias siguen en inglés.')).toBeVisible();
  expect(screen.queryByRole('heading', {name:'Foundations'})).not.toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');
});
