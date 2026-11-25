// End-of-week review: where each meter came from, what would have optimized it,
// where it was needed this week, and where it will be needed next.
import { CAPABILITIES, METER_ORDER } from '../data/capabilities.js';
import { CHAPTERS } from '../data/scenes.js';
import { LEVELS } from '../data/missions.js';
import { capabilityNeeds, choiceRequires, METER_KEYS, WEEKS_PER_LEVEL } from './engine.js';
import { weekGains } from './goals.js';


function walkConds(lines, out) {
  for (const item of lines || []) {
    if (Array.isArray(item)) walkConds(item, out);
    else if (item) {
      if (item.if) out.push(item.if);
      if (item.lines) walkConds(item.lines, out);
    }
  }
  return out;
}

// Capability checks in a chapter, evaluated against the current state.
export function chapterChecks(s, level, week) {
  const chap = (CHAPTERS[level] || {})[week];
  if (!chap) return [];
  const out = [];
  for (const b of chap.beats) {
    for (const c of b.choices) {
      const req = choiceRequires(c);
      if (req) {
        const needs = capabilityNeeds(s, req);
        if (needs.length) out.push({ label: c.label, kind: 'choice', needs });
      }
      for (const cond of walkConds(Array.isArray(c.result) ? c.result : [], [])) {
        const needs = capabilityNeeds(s, cond);
        if (needs.length) out.push({ label: c.label, kind: 'outcome', needs });
      }
    }
    for (const cond of walkConds(b.lines, [])) {
      const needs = capabilityNeeds(s, cond);
      if (needs.length) out.push({ label: 'How the scene opens', kind: 'scene', needs });
    }
  }
  return out;
}

function nextChapterRef(s) {
  if (s.week < WEEKS_PER_LEVEL) return { level: s.level, week: s.week + 1 };
  const next = LEVELS[s.level + 1];
  if (next && !next.futureScope && CHAPTERS[s.level + 1]) return { level: s.level + 1, week: 1 };
  return null;
}

export function buildReview(s) {
  const ledger = s.weekLedger || [];
  const gains = weekGains(s);
  const nextRef = nextChapterRef(s);
  const nextChap = nextRef ? CHAPTERS[nextRef.level][nextRef.week] : null;
  const upcoming = nextRef ? chapterChecks(s, nextRef.level, nextRef.week) : [];

  const meters = METER_ORDER.map((m) => {
    const cap = CAPABILITIES[m];
    const value = s.meters[METER_KEYS[m]];

    // Where it came from.
    const sources = [];
    const acts = {};
    for (const e of ledger) {
      const v = (e.gains || {})[m] || 0;
      if (!v) continue;
      if (e.src === 'activity') { acts[e.label] = (acts[e.label] || 0) + v; continue; }
      sources.push({ label: e.label, title: e.title, v });
    }
    for (const [name, v] of Object.entries(acts)) sources.push({ label: name, title: 'daily activity', v });
    const top = sources.filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 2);
    const costs = sources.filter((x) => x.v < 0).sort((a, b) => a.v - b.v).slice(0, 1);

    // The best skipped option for this meter.
    let best = null;
    for (const e of ledger) {
      if (!e.alts) continue;
      const chosen = (e.gains || {})[m] || 0;
      for (const a of e.alts) {
        if (a.hidden) continue;
        const diff = (a.eff[m] || 0) - chosen;
        if (diff <= 0) continue;
        if (!best || diff > best.diff || (diff === best.diff && best.locked && !a.locked)) {
          best = { diff, label: a.label, title: e.title, value: a.eff[m], locked: a.locked, momentum: a.momentum };
        }
      }
    }

    // Where this meter was checked this week, and where it will be checked next.
    const seen = new Set();
    const checks = [];
    for (const e of ledger) for (const c of e.checks || []) {
      for (const n of c.needs) {
        if (n.kind !== 'meter' || n.meter !== m) continue;
        const key = `${c.label}|${n.need}`;
        if (seen.has(key)) continue;
        seen.add(key);
        checks.push({ label: c.label, need: n.need, have: n.have, ok: n.ok });
      }
    }
    const next = [];
    for (const c of upcoming) for (const n of c.needs) {
      if (n.kind === 'meter' && n.meter === m) next.push({ label: c.label, kind: c.kind, need: n.need, have: value, ok: value >= n.need });
    }

    return { m, cap, value, gain: gains[m] || 0, top, costs, best, checks, next, need: cap.need[s.level] || '' };
  });

  const relationshipChecks = upcoming.flatMap((c) => c.needs.filter((n) => n.kind !== 'meter')
    .map((n) => ({ choice: c.kind === 'choice' ? c.label : `${c.label} (changes the outcome)`, needLabel: n.label, need: n.need, have: n.have, ok: n.ok })));

  return {
    empty: !ledger.length,
    meters,
    nextTitle: nextChap ? nextChap.title : '',
    nextIsNewLevel: !!(nextRef && nextRef.level !== s.level),
    relationshipChecks,
  };
}

/* ---------- The professor's weekly check-in (dialogue before the summary) ---------- */
const lower1 = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const sign = (v) => (v > 0 ? `+${v}` : `${v}`);

export function reviewTalkLines(s) {
  const r = buildReview(s);
  const P = (text, expression) => ({ speaker: 'mercer', text, ...(expression ? { expression } : {}) });
  const me = (text, expression) => ({ speaker: 'sean', text, ...(expression ? { expression } : {}) });
  const nar = (text) => ({ speaker: 'narrator', text });
  const out = [];
  out.push(nar(s.level === 1
    ? 'After class, {c:mercer} waves you over. "Got five minutes to look back at your week?"'
    : s.level === 2
      ? '{c:mercer} checks in over a quick video call, as he does with former students. "Got five minutes to look back at your week?"'
      : '{c:mercer} calls to congratulate you on the new role, as he does with former students who become managers. "Got five minutes to look back at your week?"'));
  if (s.level >= 3 && !r.empty) {
    const g = weekGains(s);
    const m = g.morale || 0;
    const pc = g.pc || 0;
    out.push(P(m < 0 && pc > 0
      ? 'I noticed your standing with leadership went up while your team\'s morale went down. That trade-off is common for new managers. Is it the one you want?'
      : m > 0 && pc < 0
        ? 'Your team seems happier this week, but you spent some credibility with leadership. Sometimes that\'s the right call. Just keep an eye on it.'
        : m >= 0 && pc >= 0 ? 'Both your team and your standing look steady or better this week. Nicely done.' : 'This was a hard week for both your team and your standing. What would you do differently?', m < 0 && pc < 0 ? 'concerned' : 'happy'));
  }

  if (r.empty) {
    out.push(P("Looks like you skipped ahead this week, so there isn't much to review. Play a full week and we'll talk it through.", 'happy'));
    out.push(P("Here's the summary anyway."));
    return out;
  }

  const byGain = r.meters.slice().sort((a, b) => b.gain - a.gain);
  const top = byGain[0];
  const low = byGain[byGain.length - 1];

  out.push(P('You make choices like this every week. Which of your three meters moved the most?'));
  if (top.gain > 0) {
    out.push(me(`${top.cap.name}. It went up ${top.gain}, to ${top.value}.`, 'happy'));
    if (top.top[0]) out.push(P(`Mostly from "${top.top[0].label}"${top.top[0].title ? `, during ${top.top[0].title}` : ''}. That was a good use of your time.`, 'happy'));
  } else {
    out.push(me('Honestly, not much moved this week.', 'concerned'));
    out.push(P("That happens. Let's see where the openings were."));
  }

  // The meter that grew least, and the stronger option for it.
  const miss = (low.best && low !== top) ? low : r.meters.find((m) => m.best && m !== top) || (top.best ? top : null);
  if (miss) {
    out.push(P(`Now the one that grew least: ${miss.cap.name} (${sign(miss.gain)}). One option you passed on: "${miss.best.label}" would have added ${miss.best.value}.`));
    if (miss.best.locked) out.push(P(`It was locked that day: ${lower1(miss.best.locked.replace(/\.$/, ''))}. That's why building it early matters.`, 'concerned'));
    else if (miss.best.momentum) out.push(P('That one needed ⚡ Momentum, which you only earn by logging real actions.'));
  }

  // The most important check coming up next week.
  const nexts = r.meters.flatMap((m) => m.next.map((c) => ({ ...c, name: m.cap.name, m })));
  const nextCheck = nexts.find((c) => !c.ok) || nexts[0];
  if (nextCheck) {
    const where = r.nextTitle ? ` in "${r.nextTitle}"` : '';
    if (nextCheck.ok) out.push(P(`Next week${where}, "${nextCheck.label}" needs ${nextCheck.name} ${nextCheck.need}+. You're at ${nextCheck.have}, so you're ready.`, 'happy'));
    else out.push(P(`Next week${where}, "${nextCheck.label}" needs ${nextCheck.name} ${nextCheck.need}+. You're at ${nextCheck.have}, so it's worth building this week.`, 'concerned'));
    if (nextCheck.m.need) out.push(P(`More generally, you'll lean on ${nextCheck.name} ${lower1(nextCheck.m.need)}`));
  } else if (r.relationshipChecks[0]) {
    const c = r.relationshipChecks[0];
    out.push(P(`Next week, "${c.choice}" depends on ${lower1(c.needLabel)} (${c.need}+, you have ${c.have}).`, c.ok ? 'happy' : 'concerned'));
  }

  out.push(me('Got it. Thank you.', 'happy'));
  out.push(P("Here's the full picture for the week.", 'happy'));
  return out;
}
