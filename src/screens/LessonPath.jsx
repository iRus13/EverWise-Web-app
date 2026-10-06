import { tr, useLocale } from '../i18n';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowDown, Check, ChevronDown, ChevronRight, Lock, Search, X } from "lucide-react";
import { lessonsByOrder as lessons, examsByOrder, challengesByOrder, pathOrderForPhase } from "../data/course-catalog.js";
import { getPhase, phaseLabel } from "../data/phases";
import { findCurrentPlayableId } from "../utils/courseProgress.js";
import "../styles/course-path.css";

const curriculum = { lessons, challenges: challengesByOrder, exams: examsByOrder };
const playables = [
  ...lessons.map((lesson, lessonIndex) => ({
    kind: "lesson", id: lesson.id, order: lesson.pathOrder ?? lesson.order,
    phase: lesson.phase, title: lesson.title, lessonIndex, quizCount: lesson.quizCount,
    lessonNumber: lessons.slice(0, lessonIndex + 1).filter(item => item.phase === lesson.phase).length,
    label: `Lesson ${lessons.slice(0, lessonIndex + 1).filter(item => item.phase === lesson.phase).length}`,
  })),
  ...challengesByOrder.map(challenge => ({
    kind: "challenge", id: challenge.id, order: pathOrderForPhase(challenge.phase) + 0.4,
    phase: challenge.phase, title: challenge.title, challenge, label: "Final challenge",
  })),
  ...examsByOrder.filter(exam => exam?.id && exam.questionCount > 0).map(exam => ({
    kind: "exam", id: exam.id, order: pathOrderForPhase(exam.phase) + 0.5,
    phase: exam.phase, title: exam.title, exam, label: "Phase exam",
  })),
].sort((a, b) => a.order - b.order);
const phaseGroups = [...new Set(playables.map(item => item.phase))].map(number => ({
  ...getPhase(number), steps: playables.filter(item => item.phase === number),
}));

const searchText = value => value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

export default function LessonPath({
  completedLessons = [], onSelectLesson, onSelectExam, onSelectChallenge,
  onTestOutLesson, onBack, hasSavedLessonPosition, hasSavedAssessmentPosition,
}) {
  const locale = useLocale();
  const doneSet = new Set(completedLessons);
  const currentId = findCurrentPlayableId(playables, completedLessons, curriculum);
  const current = playables.find(item => item.id === currentId);
  const completed = playables.filter(item => doneSet.has(item.id)).length;
  const allDone = completed === playables.length;
  const activePhaseNumber = current?.phase ?? phaseGroups[0].number;
  const [expanded, setExpanded] = useState(() => new Set([activePhaseNumber]));
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef(null);
  const searchButton = useRef(null);
  const scrollPositions = useRef([]);
  const wasSearching = useRef(false);
  const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
  const displayedPhases = searching ? phaseGroups.map(phase => ({
    ...phase,
    steps: terms.length ? phase.steps.filter(step => {
      const text = searchText(`${step.title} ${tr(step.title)} ${step.kind} ${tr(step.kind)} ${step.label} ${step.kind === "lesson" ? tr("Lesson {number}",{number:step.lessonNumber}) : tr(step.label)} Phase ${tr("Phase")} ${phaseLabel(phase)} ${phase.title} ${tr(phase.title)}`);
      return terms.every(term => text.includes(term));
    }) : [],
  })).filter(phase => phase.steps.length) : phaseGroups;
  const resultCount = displayedPhases.reduce((sum, phase) => sum + phase.steps.length, 0);
  const currentRef = useRef(null);
  const toolbarRef = useRef(null);
  const [locateRequest, setLocateRequest] = useState(0);

  useLayoutEffect(() => {
    let frame;
    if (searching) {
      for (const [owner] of scrollPositions.current) owner.scrollTop = 0;
      searchInput.current?.focus({preventScroll:true});
    } else if (wasSearching.current) {
      searchButton.current?.focus({preventScroll:true});
      // WebKit may apply a pending focus/scroll adjustment after this layout.
      // Reapply once at the next frame, before the explicit Current step effect.
      const restore = () => {
        for (const [owner, top] of scrollPositions.current) owner.scrollTop = top;
      };
      restore();
      frame = requestAnimationFrame(restore);
    }
    wasSearching.current = searching;
    return () => cancelAnimationFrame(frame);
  }, [searching]);

  function toggleSearch() {
    // End input focus before removing the field. Otherwise WebKit can finish
    // a pending input reveal against the restored course when Escape closes it.
    if (searching) searchInput.current?.blur();
    if (!searching) {
      let owner = toolbarRef.current?.parentElement;
      const owners = new Set([owner?.querySelector(".path-scroll"), document.scrollingElement]);
      while (owner) { owners.add(owner); owner = owner.parentElement; }
      scrollPositions.current = [...owners].filter(Boolean).map(element => [element, element.scrollTop]);
    }
    setQuery("");
    setSearching(value => !value);
  }

  useEffect(() => {
    setExpanded(previous => previous.has(activePhaseNumber) ? previous : new Set([...previous, activePhaseNumber]));
  }, [activePhaseNumber]);

  useEffect(() => {
    // Resume at the actual next step without a delayed animated jump. The first
    // visit keeps the introduction visible; later visits reveal the current row.
    if (!currentId || currentId === playables[0].id) return undefined;
    const frame = requestAnimationFrame(() => revealCurrentStep());
    return () => cancelAnimationFrame(frame);
  }, [currentId]);

  useEffect(() => {
    if (!locateRequest) return undefined;
    const frame = requestAnimationFrame(() => {
      const action = currentRef.current?.querySelector("button");
      action?.focus({preventScroll:true});
      revealCurrentStep();
    });
    return () => cancelAnimationFrame(frame);
  }, [locateRequest]);

  function revealCurrentStep() {
    const row = currentRef.current;
    if (!row) return;
    let owner = row.parentElement;
    while (owner && (!/^(auto|scroll)$/.test(getComputedStyle(owner).overflowY) || owner.scrollHeight <= owner.clientHeight + 1)) {
      owner = owner.parentElement;
    }
    owner ||= document.scrollingElement;
    if (!owner) return;
    const documentScroll = owner === document.scrollingElement;
    const bounds = documentScroll ? {top:0, bottom:innerHeight} : owner.getBoundingClientRect();
    const top = Math.max(0, bounds.top, toolbarRef.current?.getBoundingClientRect().bottom || 0) + 16;
    const bottom = Math.min(innerHeight, bounds.bottom) - 16;
    const rect = row.getBoundingClientRect();
    // A very large-text row can be taller than the available screen. Show its
    // beginning rather than centering it on text halfway through the activity.
    const target = rect.height > bottom - top ? top : top + (bottom - top - rect.height) / 2;
    owner.scrollTo?.({top:owner.scrollTop + rect.top - target, behavior:"auto"});
  }

  function locateCurrentStep() {
    setSearching(false);
    setQuery("");
    setExpanded(previous => new Set([...previous, activePhaseNumber]));
    setLocateRequest(request => request + 1);
  }

  useEffect(() => {
    // In a tablet browser the primary navigation sits above this toolbar.
    // Its height changes with text size; never cover it with a fixed offset.
    const toolbar = toolbarRef.current;
    if (!toolbar) return undefined;
    const navigation = toolbar.closest(".app-shell")?.querySelector(".app-navigation");
    const update = () => {
      const style = navigation && getComputedStyle(navigation);
      const height = style?.display !== "none" && style?.flexDirection === "row" ? navigation.getBoundingClientRect().height : 0;
      toolbar.style.setProperty("--course-nav-height", `${height}px`);
      // At accessibility sizes, keep the navigation icons usable without
      // letting their enlarged labels consume the entire short viewport.
      const button = toolbar.querySelector(".course-back");
      toolbar.dataset.compactControls = String(parseFloat(getComputedStyle(button).fontSize) > 36);
    };
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    });
    observer.observe(toolbar);
    if (navigation) observer.observe(navigation);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  function togglePhase(number) {
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(number)) next.delete(number); else next.add(number);
      return next;
    });
  }

  function openStep(step) {
    if (step.kind === "lesson") onSelectLesson(step.lessonIndex);
    else if (step.kind === "challenge") onSelectChallenge?.(step.challenge);
    else onSelectExam?.(step.exam);
  }

  return <div className={`course-path-screen course-outline${searching ? "" : " course-trail"}`}>
    <header ref={toolbarRef} className="course-path-toolbar">
      <div className="course-path-header">
        <button type="button" className="course-back" onClick={onBack} aria-label={tr("Back to home")} title={tr("Home")}>
          <ArrowLeft size={22} aria-hidden="true" /><span>{tr("Home")}</span>
        </button>
        <div className="course-toolbar-actions">
        <button ref={searchButton} type="button" className="course-search-toggle" onClick={toggleSearch}
          aria-label={tr(searching ? "Close course search" : "Search course")} title={tr(searching ? "Close search" : "Search course")}
          aria-expanded={searching} aria-controls={searching ? "course-search" : undefined}>
          {searching ? <X size={24} aria-hidden="true" /> : <Search size={24} aria-hidden="true" />}
        </button>
        {current ? <button type="button" className="course-locate" onClick={locateCurrentStep}
          aria-label={tr("Find your current step")} title={tr("Current step")}>
          <span>{tr("Current step")}</span><ArrowDown size={20} aria-hidden="true" />
        </button> : null}
        </div>
      </div>
    </header>
    <div className="path-scroll">
      <div className="course-path-content">
        {searching && <div id="course-search" className="course-search">
          <h1>{tr("Search course")}</h1>
          <form role="search" aria-label={tr("Course")} onSubmit={event => {event.preventDefault(); searchInput.current?.blur();}}>
            <label htmlFor="course-search-input">{tr("Lesson or topic")}</label>
            <div className="course-search-field">
              <Search size={22} aria-hidden="true" />
              <input ref={searchInput} id="course-search-input" type="search" value={query}
                onChange={event => setQuery(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false}
                enterKeyHint="search" placeholder={tr("e.g. passwords, banking")} aria-describedby="course-search-help"
                onKeyDown={event => {if (event.key === "Escape") {event.preventDefault(); toggleSearch();}}} />
              {query && <button type="button" aria-label={tr("Clear search")} onClick={() => {setQuery(""); searchInput.current?.focus();}}><X size={22} aria-hidden="true" /></button>}
            </div>
          </form>
          <p id="course-search-help">{tr("Search lesson titles and course topics.")}</p>
          <p className="course-search-count" role="status">{terms.length ? tr(resultCount === 1 ? "{count} result" : "{count} results",{count:resultCount}) : tr("Type a lesson name or topic to begin.")}</p>
          {terms.length > 0 && resultCount === 0 && <p className="course-search-empty">{tr("Try a shorter phrase or a broader topic, like “internet” or “money”.")}</p>}
          {terms.length > 0 && displayedPhases.some(phase => phase.steps.some(step => !doneSet.has(step.id) && step.id !== currentId)) && <p className="course-search-access">{tr("Locked steps open as you progress through the course.")}</p>}
        </div>}
        <div className={`course-path-layout${searching ? " course-search-layout" : ""}`}>
          {!searching && <div className="course-overview">
            <h1>{tr("Your path")}</h1>
            <p>{tr(allDone ? "You've finished every step. Return to any lesson whenever you need a refresher." : "Build your confidence, one small step at a time.")}</p>
            <div className="course-progress">
              <p>{tr("{completed} of {total} steps complete",{completed,total:playables.length})}</p>
              <div role="progressbar" aria-label={tr("Course progress")} aria-valuemin={0} aria-valuemax={playables.length} aria-valuenow={completed}>
                <span style={{width: `${completed / playables.length * 100}%`}} />
              </div>
            </div>
          </div>}
          <div className="course-phases">
            {displayedPhases.map(phase => {
              const phaseDone = phase.steps.filter(step => doneSet.has(step.id)).length;
              const isOpen = searching || expanded.has(phase.number);
              const isCurrent = phase.number === current?.phase;
              return <section key={phase.number} className={`course-phase${isCurrent ? " course-phase-current" : ""}`}>
                {searching ? <h2 id={`course-phase-${phase.number}`} className="course-search-phase-heading">
                  <span className="course-phase-number">{tr("Phase")} {phaseLabel(phase)}</span>
                  <span className="course-phase-title">{tr(phase.title)}</span>
                </h2> : <h2>
                  <button id={`course-phase-${phase.number}`} type="button" className="course-phase-toggle"
                    aria-expanded={isOpen} aria-controls={`course-phase-steps-${phase.number}`}
                    onClick={() => togglePhase(phase.number)}>
                    <span className="course-phase-description">
                      <span className="course-phase-number">{tr("Phase")} {phaseLabel(phase)}{isCurrent ? ` · ${tr("In progress")}` : ""}</span>
                      <span className="course-phase-title">{tr(phase.title)}</span>
                      <span className="course-phase-progress">{phaseDone === phase.steps.length ? tr("Completed") : tr("{completed} of {total} steps complete",{completed:phaseDone,total:phase.steps.length})}</span>
                    </span>
                    <ChevronDown size={22} className="course-disclosure" aria-hidden="true" />
                  </button>
                </h2>}
                <div id={`course-phase-steps-${phase.number}`} hidden={!isOpen} aria-labelledby={`course-phase-${phase.number}`}>
                  {locale === "es" && phase.number > 7 && isOpen && <p className="course-language-note">{tr("Lessons in this phase are currently in English.")}</p>}
                  <ol className="course-steps">
                    {phase.steps.map((step, stepIndex) => {
                      const done = doneSet.has(step.id);
                      const ready = step.id === currentId;
                      const enabled = ready || done;
                      const resumable = ready && !done && (step.kind === "lesson" ? Boolean(hasSavedLessonPosition?.(step.id)) : Boolean(hasSavedAssessmentPosition?.(step.id)));
                      const name = tr(done ? step.kind === "lesson" ? "Redo completed lesson: {title}" : "Redo {kind}: {title}" : resumable ? "Resume {kind}: {title}" : "Start {kind}: {title}", {kind:tr(step.kind),title:tr(step.title)});
                      const offsets = [0, 32, 0, -32];
                      const offset = offsets[stepIndex % offsets.length];
                      const nextOffset = offsets[(stepIndex + 1) % offsets.length];
                      const content = <>
                        {!searching && <span className="course-route-stop" aria-hidden="true">
                          {done ? <Check size={28} /> : ready ? <ArrowRight size={28} /> : <Lock size={25} />}
                        </span>}
                        <span className="course-step-copy">
                          <span className="course-step-title">{tr(step.title)}</span>
                          <span className="course-step-details">
                            <span className="course-step-meta">{step.kind === "lesson" ? tr("Lesson {number}",{number:step.lessonNumber}) : tr(step.label)} · {tr(done ? "Completed" : resumable ? "In progress" : ready ? "Ready to start" : "Locked")}</span>
                            <span className="course-step-indicator" aria-hidden="true">
                              {done ? <Check size={22} /> : ready ? <ArrowRight size={22} /> : <Lock size={20} />}
                            </span>
                          </span>
                          {resumable && <span className="course-resume-note">{tr("Continue where you left off")}</span>}
                        </span>
                      </>;
                      return <li key={step.id} data-course-step={step.id} ref={ready ? currentRef : null}
                        className={`course-step course-step-${done ? "done" : ready ? "ready" : "locked"}`}
                        style={!searching ? {"--path-offset": `${offset}px`} : undefined}>
                        {!searching && stepIndex < phase.steps.length - 1 && <svg className="course-route-segment" viewBox="0 0 1 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                          <path className="course-route-curved" d={`M ${offset} 0 C ${offset} 50, ${nextOffset} 50, ${nextOffset} 100`} />
                          <path className="course-route-straight" d="M 0 0 L 0 100" />
                        </svg>}
                        {enabled ? <button type="button" className="course-step-action" aria-label={name}
                          aria-current={ready ? "step" : undefined} onClick={() => openStep(step)}>{content}</button>
                          : <div className="course-step-action">{content}</div>}
                        {onTestOutLesson && step.kind === "lesson" && ready && !resumable && step.quizCount > 0 ?
                          <button type="button" className="path-test-out course-quick-check"
                            aria-label={tr("Already know this? Take a quick check: {title}",{title:tr(step.title)})}
                            onClick={() => onTestOutLesson(step.lessonIndex)}>
                            {tr("Already know this? Take a quick check")} <ChevronRight size={18} aria-hidden="true" />
                          </button> : null}
                      </li>;
                    })}
                  </ol>
                </div>
              </section>;
            })}
          </div>
        </div>
      </div>
    </div>
  </div>;
}
