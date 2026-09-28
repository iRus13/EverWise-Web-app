import {useState} from "react";
import {Award, Check, ChevronDown, Lock} from "lucide-react";
import {badgeCatalog, badgeCounts, extraEarnedBadges} from "../utils/badges";
import {phaseLabel} from "../data/phases";
import {ArrowLeftIcon} from "../components/Icons";
import "../styles/achievements.css";

function BadgeTile({badge, earned}) {
  const Icon = earned ? badge.source === "exam" ? Award : Check : Lock;
  return <li className="badge-tile" data-earned={earned}>
    <span className="badge-symbol" aria-hidden="true"><Icon size={24}/></span>
    <div className="badge-copy">
      <h3>{badge.name}</h3>
      <p>{badge.subtitle}</p>
      <p className="badge-state">{earned ? "Earned" : "Not earned yet"}</p>
    </div>
  </li>;
}

export default function Badges({badges = [], onBack}) {
  const [filter, setFilter] = useState(() => badges.length ? "earned" : "all");
  const [expanded, setExpanded] = useState(() => new Set(badges.length ? [] : [badgeCatalog()[0]?.phase.number]));
  const earnedSet = new Set(badges);
  const groups = badgeCatalog();
  const {earnedCount, total} = badgeCounts(badges);
  const bonus = extraEarnedBadges(badges);
  return <div className="badges-screen">
    <div className="badges-navigation"><div>
      <button type="button" className="badges-back" onClick={onBack} aria-label="Back to home"><ArrowLeftIcon className="h-5 w-5"/> Home</button>
    </div></div>
    <header className="badges-header">
      <h1>Your badges</h1>
      <p>{earnedCount} of {total} course badges</p>
      <div className="badges-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={earnedCount} aria-label="Course badges earned">
        <span style={{width:`${total ? earnedCount / total * 100 : 0}%`}}/>
      </div>
      <div className="badge-filters" role="group" aria-label="Show badges">
        <button type="button" aria-pressed={filter === "earned"} onClick={() => setFilter("earned")}>Earned</button>
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All badges</button>
      </div>
    </header>
    <div className="badges-content">
      {earnedCount === 0 && bonus.length === 0 && <p className="badges-empty" role="status">Finish your first lesson to earn your first badge.</p>}
      {bonus.length > 0 && <section className="badge-section">
        <div className="badge-section-heading"><div><p>Additional awards</p><h2>Exam honors</h2></div></div>
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
              aria-label={`Phase ${phaseLabel(phase)}: ${phase.title}`}
              aria-expanded={open} aria-controls={contentId} aria-describedby={countId}
              onClick={() => setExpanded(previous => {
                const next = new Set(previous);
                if (next.has(phase.number)) next.delete(phase.number); else next.add(phase.number);
                return next;
              })}>
              <span><span className="badge-phase-number">Phase {phaseLabel(phase)}</span><span className="badge-phase-title">{phase.title}</span></span>
              <ChevronDown aria-hidden="true" size={20}/>
            </button></h2>
            <p id={countId}>{earned.length} of {list.length} earned</p>
          </div> : <div className="badge-section-heading">
            <div><p>Phase {phaseLabel(phase)}</p><h2>{phase.title}</h2></div>
            <p>{earned.length} of {list.length} earned</p>
          </div>}
          <div id={contentId} hidden={!open}>
            {open && <ul className="badges-grid">{visible.map(badge => <BadgeTile key={badge.name} badge={badge} earned={earnedSet.has(badge.name)}/>)}</ul>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
