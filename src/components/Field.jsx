import { tr, useLocale } from '../i18n';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "../styles/field.css";

// Accessible form field: a large, clearly associated label above a big input.
// High contrast and generous sizing for older eyes and hands.
export default function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  min,
  onBlur,
  ariaInvalid,
  describedBy,
  inputMode,
  disabled = false,
  inputRef,
  autoCapitalize,
  spellCheck,
}) {
  useLocale();
  const [revealed, setRevealed] = useState(false);
  const input = useRef(null);
  const selection = useRef(null);
  const password = type === "password";
  const setInput = useCallback(node => {
    input.current = node;
    if (typeof inputRef === "function") inputRef(node);
    else if (inputRef) inputRef.current = node;
  }, [inputRef]);
  useEffect(() => {
    if (!value || disabled) setRevealed(false);
  }, [value, disabled]);
  useEffect(() => {
    const conceal = () => { if (document.hidden) setRevealed(false); };
    document.addEventListener("visibilitychange", conceal);
    return () => document.removeEventListener("visibilitychange", conceal);
  }, []);
  useLayoutEffect(() => {
    if (selection.current && input.current) {
      const field = input.current;
      const range = selection.current;
      selection.current = null;
      field.setSelectionRange(...range);
      // Browsers can reset the selection after React restores a controlled
      // input's value following a type change. Preserve it after that update,
      // unless the learner has already changed the value or left the field.
      const frame = requestAnimationFrame(() => {
        if (input.current === field && field.value === value) field.setSelectionRange(...range);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [revealed, value]);
  const labelElement = (
    <label htmlFor={id} className="field-label block text-xl font-semibold text-ink">{label}</label>
  );
  return (
    <div data-form-field style={{scrollMarginBlock: "12px"}}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setRevealed(false);
      }}>
      {password ? <div className="field-label-row">
        {labelElement}
        <button type="button" className="field-password-toggle" disabled={disabled}
          aria-label={revealed ? tr("Hide password") : tr("Show password")} aria-controls={id}
          onPointerDown={event => { if (document.activeElement === input.current) event.preventDefault(); }}
          onClick={() => {
            selection.current = [input.current.selectionStart, input.current.selectionEnd, input.current.selectionDirection];
            setRevealed(previous => !previous);
          }}>{revealed ? tr("Hide") : tr("Show")}</button>
      </div> : labelElement}
      <input
        ref={setInput}
        id={id}
        name={id}
        type={password && revealed ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize={password ? "none" : autoCapitalize}
        autoCorrect={password ? "off" : undefined}
        spellCheck={password ? false : spellCheck}
        placeholder={placeholder}
        min={min}
        onBlur={onBlur}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        inputMode={inputMode}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border-2 border-ink/20 bg-cream-card px-5 text-xl text-ink placeholder:text-ink-faint transition-colors focus:border-clay"
        style={{ minHeight: "62px" }}
      />
    </div>
  );
}
