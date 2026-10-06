import { hasOwn } from "../utils/hasOwn.js";
import {useCallback} from "react";
import {translate, useLocale} from "./index.js";
import spanish from "./learning-es.json";

// Imported only by deferred activity players. Keep this course dictionary out
// of startup/navigation; canonical content and saved answers are never changed.
export function learningText(text, language, values = {}) {
  if (text === "Card back" && language !== "es") return "Back";
  const translated = language === "es" && hasOwn(spanish, text) ? spanish[text] : text;
  return translate(translated, language, values);
}

export function useLearningText() {
  const language = useLocale();
  return useCallback((text, values) => learningText(text, language, values), [language]);
}

export function fillBlankParts(template, answer, t) {
  const [before, after = ""] = t(template).split("______");
  const key = `fillblank.word.${answer}`;
  const contextual = t(key);
  let word = contextual === key ? t(answer) : contextual;
  if (!before && word) word = word[0].toLocaleUpperCase() + word.slice(1);
  return {before, after, word};
}
