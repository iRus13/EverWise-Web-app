import { setLocale, tr, useLocale } from '../i18n';
import '../styles/language.css';

export default function LanguageSelect({ showContentNotice = false }) {
  const locale = useLocale();
  return <div className="language-preference">
    <label className="language-control">
      <span>{tr('Language')}</span>
      <select value={locale} onChange={event => setLocale(event.target.value)}>
        <option value="en" lang="en">English</option>
        <option value="es" lang="es">Español</option>
      </select>
    </label>
    {showContentNotice && locale === 'es' && <p className="language-content-note" role="status">{tr('Lessons through the Warning Signs phase are available in Spanish. Later lessons and AI results are currently in English.')}</p>}
  </div>;
}
