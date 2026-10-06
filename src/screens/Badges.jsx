import { tr, useLocale } from '../i18n';
import {useState} from "react";
import {Award, Badge, Check, ChevronDown} from "lucide-react";
import {badgeCatalog, badgeCounts, extraEarnedBadges} from "../utils/badges";
import {phaseLabel} from "../data/phases";
import {ArrowLeftIcon} from "../components/Icons";
import "../styles/achievements.css";

function BadgeTile({badge, earned}) {
  const Icon = earned ? badge.source === "exam" ? Award : Check : Badge;
  const activity = tr(badge.source === "exam" ? badge.subtitle === "Exam result" ? "Exam result" : "Final exam" : badge.subtitle);
  const description = tr(earned ? "Earned · {activity}" : badge.source === "exam" ? "Pass {activity} to earn" : "Complete {activity} to earn", {activity});
  return <li className="badge-tile" data-earned={earned}>
    <span className="badge-symbol" aria-hidden="true"><Icon size={24}/></span>
    <div className="badge-copy">
      <h3>{tr(badge.name)}</h3>
      <p className="badge-state">{description}</p>
    </div>
  </li>;
}

export default function Badges({badges = [], onBack, onLearn}) {
  useLocale();
  const [filter, setFilter] = useState(() => badges.length ? "earned" : "all");
  const [expanded, setExpanded] = useState(() => new Set(badges.length ? [] : [badgeCatalog()[0]?.phase.number]));
  const earnedSet = new Set(badges);
  const groups = badgeCatalog();
  const {earnedCount, total} = badgeCounts(badges);
  const bonus = extraEarnedBadges(badges);
  return <div className="badges-screen">
    <div className="badges-navigation"><div>
      <button type="button" className="badges-back" onClick={onBack} aria-label={tr("Back to home")}><ArrowLeftIcon className="h-5 w-5"/> {tr("Home")}</button>
    </div></div>
    <header className="badges-header">
      <h1>{tr("Your badges")}</h1>
      <p className="badges-total">{tr("{earned} of {total} course badges", {earned:earnedCount, total})}</p>
      <div className="badges-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={earnedCount} aria-label={tr("Course badges earned")}>
        <span style={{width:`${total ? earnedCount / total * 100 : 0}%`}}/>
      </div>
      <div className="badge-filters" role="group" aria-label={tr("Show badges")}>
        <button type="button" aria-pressed={filter === "earned"} onClick={() => setFilter("earned")}>{tr("Earned")}</button>
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{tr("All badges")}</button>
      </div>
      {onLearn && <button type="button" className="badges-learning-path" onClick={onLearn}>{tr("Your learning path")}</button>}
    </header>
    <div className="badges-content">
      {earnedCount === 0 && bonus.length === 0 && <p className="badges-empty" role="status">{tr("Finish your first lesson to earn your first badge.")}</p>}
      {bonus.length > 0 && <section className="badge-section">
        <div className="badge-section-heading"><div><p>{tr("Additional awards")}</p><h2>{tr("Exam honors")}</h2></div></div>
        <ul className="badges-grid">{bonus.map(name => <BadgeTile key={name} badge={{name,source:"exam",subtitle:"Exam result"}} earned/>)}</ul>
      </section>}
      {groups.map(({phase,badges:list}) => {
        const earned = list.filter(badge => earnedSet.has(badge.name));
        const visible = filter === "earned" ? earned : list;
        if (!visible.length) return null;
        const open = filter === "earned" || expanded.has(phase.number);
        const contentId = `badge-phase-${phase.number}`;
        const countId = `${contentId}-count`;
        return <section key={phase.number} className={`badge-section${filter === "all" ? " badge-phase" : ""}`}>
          {filter === "all" ? <div className="badge-phase-heading">
            <h2><button type="button" className="badge-phase-toggle"
              aria-expanded={open} aria-controls={contentId} aria-describedby={countId}
              onClick={() => setExpanded(previous => {
                const next = new Set(previous);
                if (next.has(phase.number)) next.delete(phase.number); else next.add(phase.number);
                return next;
              })}>
              <span><span className="badge-phase-number">{tr("Phase")} {phaseLabel(phase)}:</span><span className="badge-phase-title">{tr(phase.title)}</span></span>
              <ChevronDown aria-hidden="true" size={20}/>
            </button></h2>
            <p id={countId}>{tr("{earned} of {total} earned", {earned:earned.length, total:list.length})}</p>
          </div> : <div className="badge-section-heading">
            <div><p>{tr("Phase")} {phaseLabel(phase)}</p><h2>{tr(phase.title)}</h2></div>
            <p>{tr("{earned} of {total} earned", {earned:earned.length, total:list.length})}</p>
          </div>}
          <div id={contentId} hidden={!open}>
            {open && <ul className="badges-grid">{visible.map(badge => <BadgeTile key={badge.name} badge={badge} earned={earnedSet.has(badge.name)}/>)}</ul>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
