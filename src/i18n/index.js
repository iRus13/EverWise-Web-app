import { useSyncExternalStore } from 'react';
import spanish from './es.json';

const KEY = 'everwise.language';
const listeners = new Set();
function savedLocale() {
  try { return globalThis.localStorage?.getItem(KEY) === 'es' ? 'es' : 'en'; }
  catch { return 'en'; }
}
let locale = savedLocale();
function updateDocument() {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}
updateDocument();
export function setLocale(value) {
  if (value !== 'en' && value !== 'es') return;
  locale = value;
  try { globalThis.localStorage?.setItem(KEY, locale); } catch { /* Usable for this session when storage is unavailable. */ }
  updateDocument();
  listeners.forEach(listener => listener());
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key !== KEY && event.key !== null) return;
  locale = savedLocale();
  updateDocument();
  listeners.forEach(listener => listener());
});
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function useLocale() { return useSyncExternalStore(subscribe, () => locale, () => 'en'); }
export function tr(text, values = {}) {
  return translate(text, locale, values);
}
export function translate(text, language, values = {}) {
  const translated = language === 'es' && Object.hasOwn(spanish, text) ? spanish[text] : text;
  return typeof translated === 'string' ? translated.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match) : translated;
}
