import { tr, useLocale } from '../i18n';
import { ArrowLeftIcon } from "./Icons";
import "../styles/utility-screen.css";

// Keep compact-screen navigation outside the scrolling content. Wider
// windows already provide the persistent primary navigation in AppShell.
export default function UtilityScreen({ onBack, navigationDisabled = false, children }) {
  useLocale();
  return (
    <div className="utility-screen">
      <div className="utility-navigation">
        <button type="button" onClick={onBack} disabled={navigationDisabled} aria-label={tr("Back to home")}>
          <ArrowLeftIcon className="h-6 w-6 shrink-0" />
          <span>{tr("Home")}</span>
        </button>
      </div>
      {children}
    </div>
  );
}
