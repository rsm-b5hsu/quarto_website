// Rendering: HUD, week panel, stage (events / gate / scenes), modals, tooltips.
import { CHARACTERS, COMPANY, CAST, ALLY_POOL, L2_NETWORK, roleFor } from '../data/characters.js';
import { CITIES, CITY_ORDER, COMPARE_ROWS } from '../data/cities.js';
import { ACTIVITY_BY_ID } from '../data/activities.js';
import { GLOSSARY } from '../data/glossary.js';
import { LEVELS, PERSONAL_GOAL_PICKS } from '../data/missions.js';
import { getEvent, getChapter, choiceState, resolveVariant, explainCond, allies, capabilityNeeds, dialogDone, METER_KEYS, MAX_MOMENTUM, DAYS_PER_WEEK,
  getPrologue, currentCity, currentCompany, pathsFor, networkSummary, isLongDistance, RES_NAMES, favorCost, choiceRequires, activityState, activityOutcomes, beatChoices, offersFor, knownPeople, SKILLS, LOW_HEALTH, offerCity, MAX_SKILL } from './engine.js';
import { avatarSVG } from './avatars.js';
import { buildReview } from './review.js';
import { weekGains, getMissions, gateStatus, weekLogs, GATE_RULES, STATUS_LABELS, accountabilityEmail, STORY_PRESETS } from './goals.js';

export const $ = (sel, root = document) => root.querySelector(sel);

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const METER_LABEL = { careerCapital: 'Career Capital', networkStrength: 'Network Strength', influence: 'Influence' };
const charName = (id) => (CHARACTERS[id] ? CHARACTERS[id].display : id);
const SKILL_ICON = { communication: '💬', persuasion: '🎯', teamwork: '🧩' };
// Soft vs hard power tags on Level 3 choices.
const TAGS = {
  team: { power: 'soft', label: 'Team', term: 'tagTeam' },
  allocentrism: { power: 'soft', label: 'Allocentrism', term: 'tagAllocentrism' },
  coalitions: { power: 'soft', label: 'Coalitions', term: 'tagCoalitions' },
  persuasion: { power: 'hard', label: 'Persuasion', term: 'tagPersuasion' },
  might: { power: 'hard', label: 'Might', term: 'tagMight' },
  ethos: { power: 'hard', label: 'Ethos', term: 'tagEthos' },
};
function tagChip(s, tag) {
  const tg = TAGS[tag];
  if (!tg) return '';
  queueTerm(s, tg.power === 'soft' ? 'softPower' : 'hardPower');
  queueTerm(s, tg.term);
  // Plain text: a nested <button> inside the choice <button> is invalid HTML. The glossary card is queued above.
  return `<span class="power-tag ${tg.power}" title="${tg.power === 'soft' ? 'Soft power' : 'Hard power'}: see the glossary card">${tg.power === 'soft' ? 'Soft power' : 'Hard power'} · ${tg.label}</span>`;
}

/* ---------- Text formatting & glossary terms ---------- */

const termQueue = [];
export function queueTerm(s, id) {
  if (!id || !GLOSSARY[id] || s.seenGlossary.includes(id) || termQueue.includes(id)) return;
  termQueue.push(id);
}

export function fmt(s, text, inline = false) {
  let h = esc(text);
  const city = offerCity(s);
  const cur = currentCity(s);
  h = h.replace(/\{(c|C|t|p|co|oc|city|allies)(?::([A-Za-z0-9_]+)(?:\|([^}]*))?)?\}/g, (m, k, id, label) => {
    switch (k) {
      case 'c': return esc(charName(id));
      case 'C': return esc(CHARACTERS[id] ? CHARACTERS[id].name : id);
      case 'p': return esc(s.playerName);
      case 'co': return esc(currentCompany(s) || COMPANY);
      case 'oc': return esc(city ? city.company : COMPANY);
      case 'city': return esc(cur ? cur.city : city ? city.city : 'Atlanta, GA');
      case 'allies': return String(allies(s));
      case 't':
        queueTerm(s, id);
        return `<button type="button" class="term" data-action="term-show" data-term="${esc(id)}">${label || esc(GLOSSARY[id] ? GLOSSARY[id].term : id)}</button>`;
      default: return m;
    }
  });
  if (inline) return h;
  return h.split(/\n\n/).map((p) => `<p>${p}</p>`).join('');
}

/* ---------- Small pieces ---------- */

function remembered(s, notes) {
  if (!notes || !notes.length) return '';
  return `<p class="callback"><span aria-hidden="true">↩</span> <strong>Remembered:</strong> ${notes.map((n) => fmt(s, n, true)).join('; ')}</p>`;
}

function termBtn(id, label) {
  return `<button type="button" class="term" data-action="term-show" data-term="${id}">${esc(label)}</button>`;
}

function avatar(id, size = '') {
  const c = CHARACTERS[id] || CHARACTERS.narrator;
  return `<span class="avatar ${size}" style="--av:${c.color}" aria-hidden="true">${esc(c.initials)}</span>`;
}


function deltaChip(d) {
  const sign = (v) => (v > 0 ? `+${v}` : `−${Math.abs(v)}`);
  const cls = d.value > 0 ? 'pos' : d.value < 0 ? 'neg' : '';
  switch (d.kind) {
    case 'meter': return `<span class="chip ${cls}">${sign(d.value)} ${METER_LABEL[d.key]}</span>`;
    case 'trust': return `<span class="chip ${cls}">${avatar(d.id, 'xs')} Trust ${esc(charName(d.id))} ${sign(d.value)}</span>`;
    case 'trustMax': return `<span class="chip">${avatar(d.id, 'xs')} ${esc(charName(d.id))}: trust maxed</span>`;
    case 'carry': return '<span class="chip pos">+1 Energy tomorrow</span>';
    case 'health': return `<span class="chip ${cls}">${sign(d.value)} Health</span>`;
    case 'skill': return `<span class="chip pos">${SKILL_ICON[d.skill]} ${esc(SKILLS[d.skill])} skill ${sign(d.value)}</span>`;
    case 'skillMax': return `<span class="chip">${SKILL_ICON[d.skill]} ${esc(SKILLS[d.skill])}: already maxed</span>`;
    case 'contact': return `<span class="chip pos">${avatar(d.id, 'xs')} New contact: ${esc(charName(d.id))} (trust ${d.value})</span>`;
    case 'res': return `<span class="chip ${cls}">${sign(d.value)} ${RES_NAMES[d.res]}</span>`;
    case 'later': return '<span class="chip later">⏳ Long-term effect later</span>';
    case 'favor': return `<span class="chip spend">${avatar(d.id, 'xs')} Spent ${Math.abs(d.value)} trust with ${esc(charName(d.id))}</span>`;
    case 'energy': return `<span class="chip cost">${sign(d.value)} Energy</span>`;
    case 'momentum': return `<span class="chip mom">${sign(d.value)} ⚡ Momentum</span>`;
    default: return '';
  }
}

function deltaChips(s, deltas) {
  for (const d of deltas) {
    if (d.kind === 'meter') queueTerm(s, d.key);
    if (d.kind === 'trust' || d.kind === 'contact') queueTerm(s, 'trust');
    if (d.kind === 'favor') queueTerm(s, 'favor');
    if (d.kind === 'health') queueTerm(s, 'health');
    if (d.kind === 'skill') queueTerm(s, 'skills');
    if (d.kind === 'res') queueTerm(s, d.res === 'morale' ? 'teamMorale' : 'politicalCapital');
  }
  const effects = deltas.filter((d) => d.kind !== 'energy' && d.kind !== 'momentum');
  const html = deltas.map(deltaChip).join('');
  return `<div class="chips" aria-label="What changed">${html}${effects.length ? '' : '<span class="chip">No lasting change</span>'}</div>`;
}

function needsBadge(s, ch) {
  const req = choiceRequires(ch);
  if (!req) return '';
  const needs = capabilityNeeds(s, req).filter((n) => ['meter', 'skill', 'trust', 'res', 'allies'].includes(n.kind));
  if (!needs.length) return '';
  for (const n of needs) {
    if (n.kind === 'meter') queueTerm(s, METER_KEYS[n.meter]);
    if (n.kind === 'skill') queueTerm(s, 'skills');
    if (n.kind === 'trust') queueTerm(s, 'trust');
  }
  const icon = (n) => (n.kind === 'skill' ? SKILL_ICON[n.skill] : n.kind === 'trust' || n.kind === 'allies' ? '🤝' : n.kind === 'res' ? (n.res === 'morale' ? '💛' : '🏛') : '🎯');
  return needs.map((n) => `<span class="need ${n.ok ? 'ok' : 'no'}">${icon(n)} ${fmt(s, n.label, true)} ${n.need}+ · you: ${n.have} ${n.ok ? '✓' : '✗'}</span>`).join('');
}

// "Costs 2 trust (−1 because you helped Gian before)" + ally warning.
function favorMeta(s, ch) {
  if (!ch.favor) return '';
  queueTerm(s, 'favor');
  const { npc, cost } = ch.favor;
  const c = favorCost(s, ch);
  const helped = s.helped.includes(npc);
  const far = isLongDistance(s, npc);
  const disc = [helped ? `<span class="disc">−1: you helped ${esc(charName(npc))} before</span>` : '', far ? '<span class="warn-text">+1: long-distance tie</span>' : ''].filter(Boolean);
  const discTxt = disc.length ? ` (${disc.join(', ')})` : '';
  const have = s.trust[npc] || 0;
  const ally = (ALLY_POOL[s.level] || []).includes(npc) && have >= 3 && have - c < 3
    ? ` · <span class="warn-text">${esc(charName(npc))} would drop below ally</span>` : '';
  return `<span class="favor">🤝 Favor · costs ${c} trust with ${esc(charName(npc))}${discTxt}${ally}</span>`;
}

function choiceButton(s, ch, i, action, useEnergy) {
  const st = choiceState(s, ch, useEnergy);
  if (!st.visible) return '';
  if (ch.momentum) queueTerm(s, 'momentum');
  const meta = [];
  if (ch.momentum) meta.push(`⚡ Momentum choice · costs ${ch.momentum}`);
  if (useEnergy && ch.cost) meta.push(`${ch.cost} Energy`);
  const why = st.available && ch.requires ? explainCond(s, ch.requires).filter((n) => !/^your |^trust with /.test(n)) : [];
  if (why.length) meta.push(`↩ Unlocked because ${why.map((n) => fmt(s, n, true)).join('; ')}`);
  const badge = needsBadge(s, ch);
  const favor = favorMeta(s, ch);
  const tag = ch.tag ? tagChip(s, ch.tag) : '';
  return `<button type="button" class="choice${ch.momentum ? ' momentum' : ''}${ch.favor ? ' has-favor' : ''}${st.available ? '' : ' locked'}" data-action="${action}" data-idx="${i}" ${st.available ? '' : 'aria-disabled="true"'}>
    ${tag ? `<span class="tag-row">${tag}</span>` : ''}
    <span class="choice-label">${ch.momentum ? '<span class="bolt" aria-hidden="true">⚡</span>' : ''}${fmt(s, ch.label, true)}</span>
    ${ch.say && st.available ? `<span class="choice-say">“${fmt(s, ch.say, true)}”</span>` : ''}
    ${badge ? `<span class="needs">${badge}</span>` : ''}
    ${favor}
    ${meta.length ? `<span class="choice-meta${why.length ? ' unlocked' : ''}">${meta.join(' · ')}</span>` : ''}
    ${st.available ? '' : `<span class="lock">🔒 ${fmt(s, st.reason, true)}</span>`}
  </button>`;
}

/* ---------- Visual-novel conversation ---------- */

let lastNpc = null;
let lastStageKey = '';
let lastLineKey = '';

function actorName(s, id) {
  return id === 'sean' ? s.playerName : (CHARACTERS[id] ? CHARACTERS[id].name : '');
}

function actor(s, id, side, state, expression, swapped) {
  if (!id || !CHARACTERS[id] || !CHARACTERS[id].look) return `<div class="vn-actor ${side} empty" aria-hidden="true"></div>`;
  const c = CHARACTERS[id];
  return `<figure class="vn-actor ${side} ${state}${swapped ? ' swap' : ''}" data-actor="${esc(id)}">
    <div class="vn-avatar">${avatarSVG(id, expression)}</div>
    <figcaption><strong>${esc(actorName(s, id))}</strong><span>${esc(roleFor(id, s.level))}</span></figcaption>
  </figure>`;
}

function lineHTML(s, l, cls) {
  const side = l.speaker === 'sean' ? 'me' : (l.speaker === 'narrator' || !CHARACTERS[l.speaker] ? 'narr' : 'npc');
  const notes = l.notes && l.notes.length ? remembered(s, l.notes) : '';
  if (side === 'narr') return `<div class="line narr ${cls}">${notes}<p>${fmt(s, l.text, true)}</p></div>`;
  const who = `<span class="who">${esc(actorName(s, l.speaker))}</span>`;
  return `<div class="line ${side}${l.kind === 'action' ? ' action' : ''} ${cls}">${notes}<div class="bubble">${who}<p>${fmt(s, l.text, true)}</p></div></div>`;
}

// Renders the two-avatar scene with the last few lines as a chat history.
//   dialog/result: { lines, shown }; npcDefault: who stands on the right
function vnScene(s, { key, dialog, result, npcDefault }) {
  const shownIntro = dialog ? dialog.lines.slice(0, dialog.shown) : [];
  const shownResult = result ? result.lines.slice(0, result.shown) : [];
  const transcript = [...shownIntro, ...shownResult];
  const cur = transcript[transcript.length - 1] || null;
  const npcLine = [...transcript].reverse().find((l) => l.speaker !== 'sean' && l.speaker !== 'narrator' && CHARACTERS[l.speaker] && CHARACTERS[l.speaker].look);
  const npc = npcLine ? npcLine.speaker : (npcDefault && CHARACTERS[npcDefault] && CHARACTERS[npcDefault].look ? npcDefault : null);
  const exprOf = (id) => { const l = [...transcript].reverse().find((x) => x.speaker === id && x.expression); return l ? l.expression : 'neutral'; };
  const speaking = cur ? cur.speaker : null;
  const state = (id) => (speaking === id ? 'speaking' : (speaking === 'sean' || (speaking && speaking !== 'narrator')) ? 'dim' : 'idle');
  const swapped = lastNpc !== null && npc !== lastNpc && lastStageKey === key;
  lastNpc = npc;

  const lineKey = `${key}:${transcript.length}`;
  const isNew = lineKey !== lastLineKey;
  lastLineKey = lineKey;
  const visible = transcript.slice(-4);
  const older = transcript.length - visible.length;
  const hist = visible.map((l, i) => lineHTML(s, l, i === visible.length - 1 ? `current${isNew ? ' new' : ''}` : 'past')).join('');
  const full = older > 0
    ? `<details class="vn-log"><summary>Show full conversation (${transcript.length} lines)</summary>${transcript.map((l) => lineHTML(s, l, 'log')).join('')}</details>` : '';

  const active = result || dialog;
  const more = active && active.shown < active.lines.length;
  const next = more ? `<div class="vn-next-row">
      <button type="button" class="vn-next" data-action="line-next" data-autofocus>▸ continue <span class="muted small">(click, Space or Enter)</span></button>
      <button type="button" class="link small vn-skip" data-action="line-skip">Skip ▸▸</button>
    </div>` : '';

  return `<div class="vn-scene">
      ${actor(s, 'sean', 'left', state('sean'), exprOf('sean'), false)}
      <div class="vn-talk" aria-live="polite">${full}${hist}${next}</div>
      ${actor(s, npc, 'right', npc ? state(npc) : 'idle', npc ? exprOf(npc) : 'neutral', swapped)}
    </div>`;
}

function stageCard(key, body, extraClass = '') {
  const enter = key !== lastStageKey;
  lastStageKey = key;
  return `<div class="card stage-card${enter ? ' enter' : ''}${extraClass ? ` ${extraClass}` : ''}">${body}</div>`;
}

function draftReplies(s, choices, action, useEnergy) {
  return `<div class="drafts" role="group" aria-label="Your reply">
    <div class="drafts-head"><span class="drafts-tag">✎ Your reply</span><span class="muted small">Pick what {p} says or does.</span></div>
    ${choices.map((c, i) => choiceButton(s, c, i, action, useEnergy)).join('')}
  </div>`.replace('{p}', esc(s.playerName));
}

/* ---------- HUD ---------- */

function whereLabel(s) {
  const L = `L${s.level} · Week ${s.week}`;
  if (s.phase === 'prologue') return `Level ${s.level} · Prologue`;
  if (s.phase === 'gate') return `${L} · Reality Gate`;
  if (s.phase === 'scene') return `${L} · Chapter`;
  if (s.phase === 'levelComplete') return `Level ${s.level} complete`;
  if (s.overtime) return `${L} · Bonus day`;
  return `${L} · Day ${s.day}/${DAYS_PER_WEEK}`;
}

function renderHUD(s) {
  const meters = Object.entries(METER_LABEL).map(([k, label]) => `
    <div class="meter">
      <div class="meter-top">${termBtn(k, label)}<span class="meter-val">${s.meters[k]}</span></div>
      <div class="meter-bar m-${k}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.meters[k]}"><span style="width:${s.meters[k]}%"></span></div>
    </div>`).join('');
  const dayPhase = s.phase === 'day';
  const slots = Math.max(3, s.dayEnergy || 3, s.energy);
  const pips = dayPhase
    ? Array.from({ length: slots }, (_, i) => `<span class="pip${i < s.energy ? ' on' : ''}"></span>`).join('')
    : '<span class="muted small">—</span>';
  const stars = Array.from({ length: MAX_MOMENTUM }, (_, i) => `<span class="star${i < s.momentum ? ' on' : ''}">⚡</span>`).join('');
  const low = s.health < LOW_HEALTH;
  const skills = Object.entries(SKILLS).map(([k, label]) => `<span class="skill-badge${s.skills[k] ? ' on' : ''}" title="${label} skill ${s.skills[k]}/${MAX_SKILL}" aria-label="${label} skill ${s.skills[k]} of ${MAX_SKILL}">${SKILL_ICON[k]} ${label.slice(0, 4)}. <b>${s.skills[k]}</b></span>`).join('');
  $('#hud').innerHTML = `
    <div class="hud-inner">
      <div class="brand"><span class="logo" aria-hidden="true">◆</span><span>Network Quest</span></div>
      <div class="where" aria-live="polite">${esc(whereLabel(s))}</div>
      <div class="meters">${meters}</div>
      <div class="resources">
        <div class="res" aria-label="Energy ${dayPhase ? s.energy : 'not in use'}">${termBtn('energy', 'Energy')}<span class="pips">${pips}</span></div>
        <div class="res" aria-label="Momentum ${s.momentum} of ${MAX_MOMENTUM}">${termBtn('momentum', 'Momentum')}<span class="stars">${stars}</span></div>
        <div class="res health${low ? ' low' : ''}">${termBtn('health', 'Health')}<span class="hbar" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.health}"><span style="width:${s.health}%"></span></span><span class="hval">${s.health}${low ? ' ⚠' : ''}</span></div>
        <div class="res skills">${termBtn('skills', 'Skills')}<span class="skill-row">${skills}</span></div>
        ${s.level >= 3 ? `<div class="res l3res morale">${termBtn('teamMorale', 'Team Morale')}<span class="hbar" role="meter" aria-label="Team Morale" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.morale}"><span style="width:${s.morale}%"></span></span><span class="hval">${s.morale}</span></div>
        <div class="res l3res pc">${termBtn('politicalCapital', 'Political Capital')}<span class="hbar" role="meter" aria-label="Political Capital" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.political}"><span style="width:${s.political}%"></span></span><span class="hval">${s.political}</span></div>` : ''}
      </div>
      <nav class="hud-nav" aria-label="Game menu">
        <button type="button" class="btn small ghost-light" data-action="levels-open">Levels</button>
        <button type="button" class="btn small ghost-light" data-action="help-open">Help</button>
        <button type="button" class="btn small ghost-light" data-action="settings-open">Settings</button>
      </nav>
    </div>`;
}

/* ---------- Week panel ---------- */

function missionCard(s, m) {
  if (m.glossary) queueTerm(s, m.glossary);
  const pct = Math.min(100, Math.round((m.actual / m.target) * 100));
  const done = m.actual >= m.target;
  const pending = m.source === 'player' && s.pendingPersonalGoal
    ? `<p class="pending">Next week: ${esc(s.pendingPersonalGoal.name)} — ${s.pendingPersonalGoal.target} ${esc(s.pendingPersonalGoal.unit)}</p>` : '';
  return `<article class="mission accent-${m.accent}${done ? ' done' : ''}">
    <header>
      <span class="tag">${esc(m.tag)}${m.source === 'player' ? ' goal' : ''}</span>
      <button type="button" class="info" data-action="mission-info" data-id="${m.id}" aria-label="What counts for ${esc(m.tag)}">ⓘ</button>
    </header>
    <h3>${esc(m.name)}</h3>
    <p class="task">${esc(m.task)}</p>
    <div class="progress">
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${m.target}" aria-valuenow="${m.actual}" aria-label="${esc(m.name)} progress"><span style="width:${pct}%"></span></div>
      <span class="count"><strong>${m.actual}</strong> / ${m.target} ${esc(m.unit)}${done ? ' ✓' : ''}</span>
    </div>
    ${m.source === 'player' ? `<button type="button" class="btn small ghost" data-action="goal-edit">Edit goal</button>${pending}` : ''}
  </article>`;
}

function renderWeekPanel(s) {
  const L = LEVELS[s.level];
  const chap = getChapter(s);
  const g = gateStatus(s);
  const logs = weekLogs(s).slice().reverse();
  const reqText = s.gateRule === 'systemBoth' ? 'both system missions' : s.gateRule === 'all3' ? 'all three missions' : 'any two missions';
  const passed = s.phase === 'scene' || s.phase === 'levelComplete';
  const gateLine = passed
    ? '🔓 Gate passed this week'
    : g.met ? '🔓 Gate open — play the chapter after Day 5' : `🔒 Gate needs ${reqText}${g.forced ? ' (demo: forced closed)' : ''}`;
  const logItems = logs.length ? logs.map((l) => `
      <li>
        <span class="log-main">${l.demo ? '<span class="badge demo">DEMO SAMPLE</span> ' : ''}${esc(l.missionName)} <strong>+${l.count}</strong></span>
        <span class="log-sub">${esc(l.evidenceType.replace('_', ' '))}${l.screenshot ? ` · ${esc(l.screenshot.name)}` : ''}</span>
        <span class="badge st-${l.status}">${STATUS_LABELS[l.status]}</span>
      </li>`).join('') : '<li class="muted">Nothing logged yet this week.</li>';
  const hist = s.history.slice().reverse();
  const histItems = hist.length ? hist.map((h) => `
      <li>
        <span class="log-main">L${h.level} W${h.week} · ${esc(h.chapter)}</span>
        <span class="log-sub">${h.missions.map((m) => `${m.actual}/${m.target}`).join(' · ')}</span>
        <span class="badge ${h.gateOutcome === 'manually_overridden' ? 'st-manually_overridden' : 'st-passed'}">${h.gateOutcome === 'manually_overridden' ? 'Grace Pass · manually overridden' : 'Gate passed'}</span>
        ${h.demoAdjusted || h.demoSampleLogs ? '<span class="badge demo">Demo data</span>' : ''}
      </li>`).join('') : '<li class="muted">No completed weeks yet.</li>';

  $('#week-panel').innerHTML = `
    <div class="panel-head">
      <h2>This Week</h2>
      <p class="sub">Level ${s.level} · ${esc(L.title)} — Week ${s.week}${chap ? `: ${esc(chap.title)}` : ''}</p>
    </div>
    <p class="panel-note">Real-world missions. Only things you actually do count — game choices never do.</p>
    <div class="missions">${getMissions(s).map((m) => missionCard(s, m)).join('')}</div>
    <button type="button" class="btn primary block" data-action="log-open">＋ Log Real Action</button>
    <div class="gate-pill ${passed || g.met ? 'open' : 'closed'}">${gateLine}</div>
    ${charactersPanel(s)}
    <details class="drawer" ${logs.length ? 'open' : ''}>
      <summary>Evidence this week (${logs.length})</summary>
      <ul class="loglist">${logItems}</ul>
    </details>
    <details class="drawer">
      <summary>Past weeks (${hist.length})</summary>
      <ul class="loglist">${histItems}</ul>
    </details>
    <button type="button" class="btn ghost block" data-action="email-preview">✉ Preview weekly email</button>`;
}

function charactersPanel(s) {
  const people = knownPeople(s);
  const pool = ALLY_POOL[s.level] || [];
  const row = (id) => {
    const c = CHARACTERS[id];
    const tr = s.trust[id] || 0;
    const pips = Array.from({ length: 5 }, (_, i) => `<span class="tp${i < tr ? ' on' : ''}"></span>`).join('');
    const tags = [
      s.helped.includes(id) ? '<span class="tag helped" title="Favors from them cost 1 less trust">helped</span>' : '',
      pool.includes(id) && tr >= 3 ? '<span class="tag ally">ally</span>' : '',
      c.contact ? '<span class="tag new">contact</span>' : '',
      isLongDistance(s, id) ? '<span class="tag far" title="Long-distance tie: favors cost 1 more">long-distance</span>' : '',
    ].join('');
    return `<li class="char-row">
      <span class="mini-av" aria-hidden="true">${avatarSVG(id, 'neutral')}</span>
      <span class="char-main"><strong>${esc(c.name)}</strong> ${tags}<span class="char-role">${esc(roleFor(id, s.level))}</span></span>
      <span class="trust-pips" aria-label="Trust ${tr} of 5">${pips}</span>
    </li>`;
  };
  let rows;
  if (s.level >= 3) {
    const team = people.filter((id) => (CAST[3] || []).includes(id));
    const net = people.filter((id) => L2_NETWORK.includes(id));
    const other = people.filter((id) => !team.includes(id) && !net.includes(id));
    rows = `<li class="char-group">Your team &amp; company</li>${team.map(row).join('')}
      <li class="char-group">Your Level 2 network</li>${net.map(row).join('')}
      ${other.length ? `<li class="char-group">New contacts</li>${other.map(row).join('')}` : ''}`;
  } else rows = people.map(row).join('');
  return `<details class="drawer chars" open>
      <summary>Characters · trust (${people.length})</summary>
      <p class="muted small">${termBtn('trust', 'Trust')} 0–5 is earned through choices and spent on ${termBtn('favor', 'favors')}. It never decays.</p>
      <ul class="charlist">${rows}</ul>
    </details>`;
}

/* ---------- Stage ---------- */

function weekTheme(s) {
  const chap = getChapter(s);
  return chap ? chap.title : '';
}

function stageDay(s) {
  const ev = getEvent(s);
  if (!ev) return '<div class="card stage-card"><p>No event available.</p></div>';
  const dayLabel = s.overtime ? 'Bonus day (gate still closed)' : `Day ${s.day} of ${DAYS_PER_WEEK}`;
  const key = `day:${s.level}:${s.week}:${s.day}:${ev.id}:${s.overtime ? 'o' : ''}`;
  const dialog = s.eventDialog || { lines: [], shown: 0 };
  const res = s.eventResult;
  let body = `
    <div class="stage-head"><span class="kicker">Week ${s.week} · ${esc(weekTheme(s))} · ${dayLabel}</span><h2>${esc(ev.title)}</h2></div>
    ${vnScene(s, { key, dialog, result: res, npcDefault: ev.npc })}`;

  if (!res) {
    if (dialogDone(dialog)) body += draftReplies(s, ev.choices, 'choose', true);
    return stageCard(key, body);
  }
  if (!dialogDone(res)) return stageCard(key, body);

  body += `<div class="outcome" role="status">${deltaChips(s, res.deltas)}</div>`;
  const lastDay = s.overtime || s.day >= DAYS_PER_WEEK;
  body += activitiesPanel(s);
  body += `
    <div class="stage-actions"><button type="button" class="btn primary" data-action="end-day" data-autofocus>${lastDay ? 'End week → Reality Gate' : 'End Day →'}</button></div>`;
  return stageCard(key, body);
}

function oddsList(s, act) {
  return activityOutcomes(s, act).map((o) => `<li class="${o.good ? 'good' : 'bad'}"><span class="pct">${Math.round(o.p * 100)}%</span> ${esc(o.label)}</li>`).join('');
}

function activitiesPanel(s) {
  const cards = s.dayActs.map((id) => {
    const a = ACTIVITY_BY_ID[id];
    if (!a) return '';
    const st = activityState(s, a);
    return `<li class="act${st.available ? '' : ' off'}">
      <button type="button" class="act-btn" data-action="activity" data-id="${a.id}" ${st.available ? '' : 'aria-disabled="true"'}>
        <span class="act-top"><span class="act-icon" aria-hidden="true">${a.icon}</span><strong>${esc(a.name)}</strong><span class="act-cost">${a.energy} Energy</span></span>
        <ul class="odds" aria-label="Possible outcomes">${oddsList(s, a)}</ul>
        ${st.available ? '' : `<span class="lock">🔒 ${esc(st.reason)}</span>`}
      </button>
    </li>`;
  }).join('');
  const log = s.dayLog.map((e) => {
    const a = ACTIVITY_BY_ID[e.id];
    const name = a ? `${a.icon} ${esc(a.name)}` : esc(e.id);
    const head = e.good ? `<strong>${name}:</strong> ${esc(e.text)}` : `<strong>${name}: ✗ ${esc(e.label)}.</strong> ${esc(e.reason)}`;
    return `<li class="${e.good ? 'good' : 'bad'}"><p>${head}${e.consolation ? ` <span class="consol">Silver lining: ${esc(e.consolation)}</span>` : ''}</p>${deltaChips(s, e.deltas)}</li>`;
  }).join('');
  const health = s.lowHealthToday ? `<p class="warn-text small">⚠ Health was below ${LOW_HEALTH} this morning, so you started with 1 less Energy. Rest or the gym will help.</p>` : '';
  const city = currentCity(s);
  return `<section class="acts" aria-label="Today's activities">
      <div class="acts-head"><h3>Today's activities · Energy left: ${s.energy}</h3>
        <p class="muted small">Pick as many as your Energy allows. The odds are shown up front — results are seeded, so a replay with the same seed rolls the same way.</p>
        ${city ? `<p class="city-note small">📍 ${esc(city.short)}: ${esc(city.l2.modsText)}</p>` : ''}
        ${health}
        <p class="rule-note small">In-game activities never count toward your real-world missions.</p>
      </div>
      <ul class="act-grid">${cards}</ul>
      ${log ? `<ul class="daylog">${log}</ul>` : ''}
    </section>`;
}

function offerTable(s) {
  const { offered, missing, reason } = offersFor(s);
  const head = CITY_ORDER.map((k) => {
    const c = CITIES[k];
    const off = k === missing;
    return `<th scope="col" class="${off ? 'not-offered' : ''}">${esc(c.short)}<span>${esc(c.company)}</span><em>${esc(c.industry)}</em>${off ? '<b class="no-offer">Not offered</b>' : ''}</th>`;
  }).join('');
  const rows = COMPARE_ROWS.map(([key, label]) => `<tr><th scope="row">${esc(label)}</th>${CITY_ORDER.map((k) => {
    let v = CITIES[k].compare[key];
    if (key === 'pay' && k === 'atlanta' && s.flags.includes('negotiated')) v += ' (+ your negotiated bump)';
    return `<td class="${k === missing ? 'not-offered' : ''}">${esc(v)}</td>`;
  }).join('')}</tr>`).join('');
  const l2 = `<tr class="l2row"><th scope="row">In Level 2</th>${CITY_ORDER.map((k) => `<td class="${k === missing ? 'not-offered' : ''}">${esc(CITIES[k].l2.modsText)}</td>`).join('')}</tr>`;
  return `<div class="offer-wrap">
      <p class="small">You have <strong>${offered.length} offers</strong>. No column wins every row — pick the trade-offs that fit you.</p>
      <div class="table-wrap"><table class="offer-table"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}${l2}</tbody></table></div>
      ${missing ? `<p class="muted small">🔒 ${esc(CITIES[missing].company)} (${esc(CITIES[missing].short)}) didn't make an offer: ${fmt(s, reason, true)}</p>` : ''}
    </div>`;
}

function stagePrologue(s) {
  const p = getPrologue(s);
  const L = LEVELS[s.level];
  const key = `prologue:${s.level}`;
  const d = (s.prologue && s.prologue.dialog) || { lines: [], shown: 0 };
  const city = currentCity(s);
  let body = `<div class="stage-head"><span class="kicker">Level ${s.level} · ${esc(L.title)} · Prologue${city ? ` · ${esc(city.city)}` : ''}</span><h2>${fmt(s, p.title, true)}</h2></div>
    ${vnScene(s, { key, dialog: d, result: null, npcDefault: p.npc })}`;
  if (dialogDone(d)) {
    if (s.level >= 3) body += networkCard(s);
    body += `<p class="muted small">Next: Week 1 begins. Each day has one event and a few activities; the week's chapter opens once your real-world missions are met.</p>
      <div class="stage-actions"><button type="button" class="btn primary" data-action="prologue-done" data-autofocus>Begin Week 1 →</button></div>`;
  }
  return stageCard(key, body, 'prologue-card');
}

function pathsTable(s) {
  const { current, relocate, missing, reason } = pathsFor(s);
  const cols = [current, ...relocate, ...(missing ? [missing] : [])];
  const allyN = networkSummary(s).filter((n) => n.status === 'ally').length;
  const head = cols.map((k, i) => {
    const c = CITIES[k];
    const off = k === missing;
    const title = i === 0 ? `Stay · ${esc(c.short)}` : esc(c.short);
    const co = i === 0 && s.offer ? s.offer.company : c.company;
    return `<th scope="col" class="${off ? 'not-offered' : ''}">${title}<span>${esc(co)}</span><em>${esc(i === 0 ? 'Manager, your current team' : c.l3.role)}</em>${off ? '<b class="no-offer">Not offered</b>' : ''}</th>`;
  }).join('');
  const rows = COMPARE_ROWS.map(([key, label]) => `<tr><th scope="row">${esc(label)}</th>${cols.map((k) => `<td class="${k === missing ? 'not-offered' : ''}">${esc(CITIES[k].compare[key])}</td>`).join('')}</tr>`).join('');
  const net = `<tr class="netrow"><th scope="row">Existing network here</th>${cols.map((k, i) => `<td class="${k === missing ? 'not-offered' : ''}">${i === 0
    ? `Full local network: Ted, Ben, Jihee, Shalini at current trust (${allyN} ${allyN === 1 ? 'ally' : 'allies'})`
    : 'Start fresh. Level 2 colleagues become long-distance ties (trust −1, favors cost 1 more)'}</td>`).join('')}</tr>`;
  return `<div class="offer-wrap">
      <p class="small">Stay, or take one of <strong>${relocate.length} manager offers</strong> elsewhere. No option wins every row.</p>
      <div class="table-wrap"><table class="offer-table"><thead><tr><th></th>${head}</tr></thead><tbody>${net}${rows}</tbody></table></div>
      ${missing ? `<p class="muted small">🔒 ${esc(CITIES[missing].company)} (${esc(CITIES[missing].short)}) didn't make an offer: ${fmt(s, reason, true)}</p>` : ''}
    </div>`;
}

function networkCard(s) {
  const rows = networkSummary(s).map((n) => {
    const c = CHARACTERS[n.id];
    const pips = Array.from({ length: 5 }, (_, i) => `<span class="tp${i < n.trust ? ' on' : ''}"></span>`).join('');
    const label = n.status === 'ally' ? 'Ally — will help' : n.status === 'distant' ? 'Distant — may get in the way' : 'Friendly, not yet an ally';
    return `<li class="net-${n.status}"><span class="mini-av" aria-hidden="true">${avatarSVG(n.id, n.status === 'ally' ? 'happy' : 'neutral')}</span>
      <span><strong>${esc(c.name)}</strong> <span class="muted small">${esc(c.role)}</span><br><span class="net-label">${label}</span>${n.longDistance ? ' <span class="tag far">long-distance</span>' : ''}</span>
      <span class="trust-pips dark" aria-label="Trust ${n.trust} of 5">${pips}</span></li>`;
  }).join('');
  return `<section class="net-card" aria-label="Your network"><h3>Your network from Level 2</h3><ul>${rows}</ul>
    <p class="muted small">Allies (trust 3+) unlock options in Level 3. Distant relationships can turn into obstacles.</p></section>`;
}

function stageGate(s) {
  queueTerm(s, 'realityGate');
  const g = gateStatus(s);
  const chap = getChapter(s);
  if (!g.met) queueTerm(s, 'gracePass');
  const rows = g.missions.map((m) => `
    <li class="${m.met ? 'met' : 'unmet'}">
      <span class="gi" aria-hidden="true">${m.met ? '✓' : '✗'}</span>
      <span class="gname">${esc(m.name)}${m.required ? '' : ' <span class="muted small">(optional under this rule)</span>'}</span>
      <span class="gcount">${m.actual}/${m.target} ${esc(m.unit)}${m.met ? '' : ` — <strong>need ${m.short} more</strong>`}</span>
    </li>`).join('');
  let actions;
  if (g.met) {
    actions = `<p class="ok">✓ The gate is open. Your real-world actions unlocked this chapter.</p>
      <div class="stage-actions"><button type="button" class="btn primary" data-action="gate-enter" data-autofocus>Play Chapter ${s.week}: ${esc(chap.title)} →</button></div>`;
  } else {
    actions = `<p>Not yet. ${g.forced ? '<strong>Demo: gate forced to fail.</strong> ' : ''}Only things you did in real life count here — no game choice can open this gate.</p>
      <div class="gate-actions">
        <button type="button" class="btn primary" data-action="log-open" data-autofocus>＋ Log Real Action</button>
        <button type="button" class="btn" data-action="bonus-day">Play a bonus day <span class="muted small">(daily events stay open)</span></button>
        <button type="button" class="btn warn" data-action="grace" ${g.graceAvailable ? '' : 'disabled'}>
          ${g.graceAvailable ? 'Use Grace Pass' : 'Grace Pass used'} <span class="small">(1 per level · recorded as “manually overridden”)</span>
        </button>
      </div>`;
  }
  return `<div class="card stage-card">
    <div class="stage-head"><span class="kicker">End of Week ${s.week} · ${termBtn('realityGate', 'Reality Gate')}</span><h2>Chapter ${s.week}: ${esc(chap.title)}</h2></div>
    <div class="gate ${g.met ? 'open' : 'closed'}">
      <div class="gate-icon" aria-hidden="true">${g.met ? '🔓' : '🔒'}</div>
      <p>This week's chapter opens with real-world actions. Current rule: <strong>${esc(GATE_RULES[s.gateRule])}</strong>.</p>
      <ul class="gate-list">${rows}</ul>
      ${actions}
    </div>
  </div>`;
}

function stageScene(s) {
  const chap = getChapter(s);
  const n = chap.beats.length;
  const b = s.scene.beat;
  if (s.scene.review === 'talk') {
    const key = `reviewtalk:${s.level}:${s.week}`;
    const d = s.scene.reviewDialog;
    let body = `<div class="stage-head"><span class="kicker">End of Week ${s.week} · Review</span><h2>Weekly check-in with ${esc(CHARACTERS.mercer.display)}</h2></div>
      ${vnScene(s, { key, dialog: d, result: null, npcDefault: 'mercer' })}`;
    if (dialogDone(d)) body += `<div class="stage-actions"><button type="button" class="btn primary" data-action="review-summary" data-autofocus>See the weekly summary →</button></div>`;
    return stageCard(key, body);
  }
  if (s.scene.review) return stageReview(s);
  const override = s.gateOutcome === 'manually_overridden'
    ? '<span class="badge st-manually_overridden">Opened with Grace Pass · manually overridden</span>' : '';
  const key = `scene:${s.level}:${s.week}:${b}`;
  const dialog = s.scene.dialog || { lines: [], shown: 0 };
  if (b >= n) {
    let body = `
      <div class="stage-head"><span class="kicker">Chapter ${s.week} · ${esc(chap.title)}</span><h2>Chapter complete</h2>${override}</div>
      ${vnScene(s, { key, dialog, result: null, npcDefault: chap.beats[n - 1].npc })}`;
    if (dialogDone(dialog)) {
      body += `<p class="muted small">Next: a quick check-in with ${esc(CHARACTERS.mercer.display)} about what built your Career Capital, Network Strength and Influence this week, then the full summary.</p>
        <div class="stage-actions"><button type="button" class="btn primary" data-action="review-open" data-autofocus>Weekly check-in →</button></div>`;
    }
    return stageCard(key, body);
  }
  const beat = chap.beats[b];
  const res = s.scene.result;
  let body = `
    <div class="stage-head"><span class="kicker">Chapter ${s.week} · ${esc(chap.title)} · ${n > 1 ? `Decision ${b + 1} of ${n}` : 'Scene'}</span><h2>${esc(chap.title)}</h2>${override}</div>
    ${vnScene(s, { key, dialog, result: res, npcDefault: beat.npc })}`;
  const choices = beatChoices(s, beat);
  if (!choices.length) {
    if (dialogDone(dialog)) body += `<div class="stage-actions"><button type="button" class="btn primary" data-action="scene-next" data-autofocus>Continue →</button></div>`;
  } else if (!res) {
    if (dialogDone(dialog)) body += (beat.dynamic === 'offers' ? offerTable(s) : beat.dynamic === 'paths' ? pathsTable(s) : '') + draftReplies(s, choices, 'scene-choose', false);
  } else if (dialogDone(res)) {
    body += `<div class="outcome" role="status">${deltaChips(s, res.deltas)}</div>
      <div class="stage-actions"><button type="button" class="btn primary" data-action="scene-next" data-autofocus>Continue →</button></div>`;
  }
  return stageCard(key, body);
}

/* ---------- End-of-week review ---------- */

function checkRow(s, c) {
  return `<li class="${c.ok ? 'ok' : 'no'}"><span aria-hidden="true">${c.ok ? '✓' : '✗'}</span> ${fmt(s, c.label, true)} <span class="muted">— needed ${c.need}+${c.have != null ? `, you had ${c.have}` : ''}</span></li>`;
}

function stageReview(s) {
  const r = buildReview(s);
  const key = `review:${s.level}:${s.week}`;
  const cards = r.meters.map((m) => {
    const src = m.top.length
      ? `<ul>${m.top.map((x) => `<li><strong>+${x.v}</strong> ${fmt(s, x.label, true)}${x.title ? ` <span class="muted">(${esc(x.title)})</span>` : ''}</li>`).join('')}
         ${m.costs.map((x) => `<li class="cost"><strong>${x.v}</strong> ${fmt(s, x.label, true)}${x.title ? ` <span class="muted">(${esc(x.title)})</span>` : ''}</li>`).join('')}</ul>`
      : '<p class="muted">Nothing you chose this week built this one.</p>';
    const best = m.best
      ? `<p>${m.best.locked ? '🔒' : '💡'} <strong>+${m.best.value}</strong> ${fmt(s, m.best.label, true)} <span class="muted">(${esc(m.best.title)})</span>${m.best.momentum ? ' <span class="chip mom">⚡ Momentum</span>' : ''}${m.best.locked ? `<br><span class="small muted">Locked then: ${fmt(s, m.best.locked, true)}</span>` : ''}</p>`
      : '<p class="muted">You already took the strongest option for this every time.</p>';
    const checks = m.checks.length ? `<h4>Where it mattered this week</h4><ul class="checks">${m.checks.map((c) => checkRow(s, c)).join('')}</ul>` : '';
    const next = m.next.length
      ? `<h4>Coming up${r.nextTitle ? ` in “${esc(r.nextTitle)}”` : ''}</h4><ul class="checks">${m.next.map((c) => checkRow(s, { ...c, label: c.kind === 'choice' ? c.label : `${c.label} (changes the outcome)` })).join('')}</ul>` : '';
    return `<section class="rv-card rv-${m.m}">
      <header><span class="rv-icon" aria-hidden="true">${m.cap.icon}</span><h3>${termBtn(m.cap.key, m.cap.name)}</h3>
        <span class="rv-val">${m.value}<span class="rv-gain ${m.gain > 0 ? 'pos' : m.gain < 0 ? 'neg' : ''}">${m.gain > 0 ? `+${m.gain}` : m.gain < 0 ? `−${Math.abs(m.gain)}` : '±0'} this week</span></span></header>
      <p class="rv-what">${esc(m.cap.what)}</p>
      <h4>What built it</h4>${src}
      <h4>Could have built more</h4>${best}
      ${checks}${next}
      <div class="rv-need"><strong>When you need it:</strong> ${esc(m.need)}</div>
      <div class="rv-real"><strong>In real life:</strong> ${esc(m.cap.realWorld)}</div>
    </section>`;
  }).join('');
  const rel = r.relationshipChecks.length
    ? `<div class="rv-rel"><h3>Relationships checked${r.nextTitle ? ` in “${esc(r.nextTitle)}”` : ' next'}</h3><ul class="checks">${r.relationshipChecks.map((c) => `<li class="${c.ok ? 'ok' : 'no'}"><span aria-hidden="true">${c.ok ? '✓' : '✗'}</span> ${fmt(s, c.choice, true)} <span class="muted">— needs ${fmt(s, c.needLabel, true)} ${c.need}+, you have ${c.have}</span></li>`).join('')}</ul></div>` : '';
  const finish = s.week >= 5 ? 'Finish level →' : `Start Week ${s.week + 1} →`;
  return stageCard(key, `
    <div class="stage-head"><span class="kicker">End of Week ${s.week} · Review</span><h2>What built your career this week</h2></div>
    <p>Every choice moved one of three meters. Here is where each came from, the stronger option you skipped, and when each one actually gets tested.</p>
    ${r.empty ? '<p class="demo-note">No choices were recorded this week (for example, after a Demo jump). Play a full week to see your breakdown.</p>' : ''}
    <div class="rv-grid">${cards}</div>
    ${s.level >= 3 ? levelThreeReview(s) : ''}
    ${rel}
    <p class="muted small">Finishing archives this week (counts, evidence statuses, gate outcome) and starts a fresh week. History is kept.</p>
    <div class="stage-actions"><button type="button" class="btn primary" data-action="scene-finish" data-autofocus>${finish}</button></div>`);
}

function levelThreeReview(s) {
  const g = weekGains(s);
  const sg = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '±0');
  const pending = (s.delayed || []).filter((d) => d.level === s.level).length;
  return `<div class="rv-rel rv-l3">
      <h3>Your team and your standing</h3>
      <ul class="checks">
        <li>💛 ${termBtn('teamMorale', 'Team Morale')}: <strong>${s.morale}</strong> (${sg(g.morale || 0)} this week) — how your reports feel. Soft-power choices usually raise it; hard power often costs it.</li>
        <li>🏛 ${termBtn('politicalCapital', 'Political Capital')}: <strong>${s.political}</strong> (${sg(g.pc || 0)} this week) — your credibility with leadership and peers. It unlocks Ethos options.</li>
        ${pending ? `<li>⏳ ${pending} long-term effect${pending === 1 ? '' : 's'} from your choices will show up in a later chapter.</li>` : ''}
      </ul>
    </div>`;
}

function stageLevelComplete(s) {
  const L = LEVELS[s.level];
  const weeks = s.history.filter((h) => h.level === s.level && h.run === s.run);
  const rows = weeks.map((h) => `<tr><td>W${h.week}</td><td>${esc(h.chapter)}</td><td>${h.missions.map((m) => `${m.actual}/${m.target}`).join(' · ')}</td><td>${h.gateOutcome === 'manually_overridden' ? 'Grace Pass' : 'Passed'}${h.demoAdjusted || h.demoSampleLogs ? ' · demo' : ''}</td></tr>`).join('');
  const next = LEVELS[s.level + 1];
  let nextBtn = '';
  if (next && !next.futureScope) {
    nextBtn = `<button type="button" class="btn primary" data-action="level-start" data-level="${s.level + 1}" data-autofocus>Start Level ${s.level + 1}: ${stageText(s, next)} →</button>`;
  } else if (!next) {
    nextBtn = `<div class="locked-card done-card">🏁 <strong>Game complete</strong><br><span class="small">Job seeker → analyst → manager. Team Morale ${s.morale}, Political Capital ${s.political}. Your real-world history stays saved in this browser.</span></div>`;
  }
  return `<div class="card stage-card">
    <div class="stage-head"><span class="kicker">Level ${s.level} · ${esc(L.title)}</span><h2>Level complete 🎓</h2></div>
    <p>Five weeks, five chapters — each one opened by real-world actions. Meters now: Career Capital ${s.meters.careerCapital}, Network Strength ${s.meters.networkStrength}, Influence ${s.meters.influence}.</p>
    <div class="table-wrap"><table class="hist"><thead><tr><th>Week</th><th>Chapter</th><th>Missions (actual/target)</th><th>Gate</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="muted small">Progress is fictional. Still job searching in real life? Repeat this level's challenges instead — your history is kept.</p>
    <div class="stage-actions wrap">${nextBtn}<button type="button" class="btn" data-action="level-start" data-level="${s.level}">Repeat Level ${s.level} challenges</button></div>
  </div>`;
}

function renderStage(s) {
  let html;
  if (s.phase === 'prologue') html = stagePrologue(s);
  else if (s.phase === 'gate') html = stageGate(s);
  else if (s.phase === 'scene') html = stageScene(s);
  else if (s.phase === 'levelComplete') html = stageLevelComplete(s);
  else html = stageDay(s);
  $('#stage').innerHTML = html;
}

export function renderAll(s) {
  renderHUD(s);
  renderWeekPanel(s);
  renderStage(s);
  $('#demo-banner').hidden = !s.demoMode;
  document.body.classList.toggle('demo-on', !!s.demoMode);
  $('#demo-fab').setAttribute('aria-pressed', s.demoMode ? 'true' : 'false');
  $('#demo-fab').textContent = s.demoMode ? '🎛 Demo panel' : '🎛 Demo Mode';
}

export function focusStage() {
  const el = $('#stage [data-autofocus]') || $('#stage .choice:not(.locked)');
  if (el) el.focus({ preventScroll: false });
}

/* ---------- Modal ---------- */

let lastFocus = null;
let modalOnClose = null;

export function isModalOpen() { return !$('#modal-root').hidden; }

export function openModal(title, bodyHTML, { wide = false, onClose = null, keepFocus = false } = {}) {
  const root = $('#modal-root');
  if (!keepFocus || root.hidden) lastFocus = document.activeElement;
  modalOnClose = onClose;
  const m = root.querySelector('.modal');
  m.classList.toggle('wide', wide);
  m.innerHTML = `
    <div class="modal-head"><h2 id="modal-title">${title}</h2><button type="button" class="close" data-action="modal-close" aria-label="Close">×</button></div>
    <div class="modal-body">${bodyHTML}</div>`;
  root.hidden = false;
  document.body.classList.add('modal-open');
  const first = m.querySelector('[data-autofocus]') || m.querySelector('input, select, textarea, button:not(.close)');
  (first || m.querySelector('.close')).focus();
}

export function closeModal() {
  const root = $('#modal-root');
  if (root.hidden) return;
  root.hidden = true;
  document.body.classList.remove('modal-open');
  root.querySelector('.modal').innerHTML = '';
  const cb = modalOnClose; modalOnClose = null;
  if (cb) cb();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

/* ---------- Glossary tooltip card ---------- */

export function showTermCard(id, isNew) {
  const g = GLOSSARY[id];
  if (!g) return;
  const card = $('#term-card');
  card.innerHTML = `
    <div class="kicker">${isNew ? 'New term' : 'Glossary'}</div>
    <h3>${esc(g.term)}</h3>
    <p>${esc(g.def)}</p>
    <p class="ex"><strong>Example:</strong> ${esc(g.example)}</p>
    <div class="row"><button type="button" class="btn small primary" data-action="term-dismiss">Got it</button><button type="button" class="btn small ghost" data-action="help-open">Full glossary</button></div>`;
  card.hidden = false;
}

export function hideTermCard() { $('#term-card').hidden = true; }

// Show the next unseen term, one at a time. Returns true if state changed.
export function flushTerms(s) {
  if (!s.introDone || isModalOpen() || !$('#term-card').hidden) return false;
  while (termQueue.length) {
    const id = termQueue.shift();
    if (s.seenGlossary.includes(id)) continue;
    s.seenGlossary.push(id);
    showTermCard(id, true);
    return true;
  }
  return false;
}

/* ---------- Toast ---------- */

let toastTimer = null;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- Modal bodies ---------- */

export function logModalHTML(s, preselect) {
  const ms = getMissions(s);
  const sel = preselect || (ms.find((m) => m.actual < m.target) || ms[0]).id;
  const defaultEv = s.level >= 2 ? 'reflection' : 'screenshot';
  return `
  <form id="log-form" novalidate>
    <p class="privacy">🔒 <strong>Privacy reminder:</strong> don't include other people's names, message contents, or confidential work info. Crop or blur screenshots first.</p>
    <label class="field">Which real mission?
      <select name="mission" id="log-mission">
        ${ms.map((m) => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${esc(m.tag)} — ${esc(m.name)} (${m.actual}/${m.target})</option>`).join('')}
      </select>
    </label>
    <p class="muted small">One log = one mission. A single message can't earn credit for two missions.</p>
    <label class="field">How many?
      <input type="number" name="count" id="log-count" min="1" max="10000" value="1" inputmode="numeric">
      <small id="count-help" class="muted"></small>
    </label>
    <fieldset class="field">
      <legend>Evidence type</legend>
      <label class="radio"><input type="radio" name="ev" value="screenshot" ${defaultEv === 'screenshot' ? 'checked' : ''}> Screenshot</label>
      <label class="radio"><input type="radio" name="ev" value="reflection" ${defaultEv === 'reflection' ? 'checked' : ''}> Short reflection</label>
      <label class="radio"><input type="radio" name="ev" value="self_report"> Self-report</label>
    </fieldset>
    <div class="ev-pane" data-ev="screenshot">
      <label class="field">Image (PNG/JPG/etc., max 5 MB)
        <input type="file" name="file" id="log-file" accept="image/*">
      </label>
      <div id="shot-preview" class="shot-preview"></div>
      <p class="error" id="shot-error" role="alert"></p>
      <p class="muted small">Only the file name, size, and type are saved — never the image itself.</p>
    </div>
    <div class="ev-pane" data-ev="reflection">
      <label class="field">Who? <span class="muted small">(role only, no names — e.g. ${s.level >= 3 ? '“a direct report”, “a peer manager”' : '“alumna in product analytics”'})</span>
        <input type="text" name="who" maxlength="100" autocomplete="off">
      </label>
      <label class="field">${s.level >= 3 ? 'What did you discuss or try to influence? <span class="muted small">(no confidential details)</span>' : 'What was exchanged?'}
        <input type="text" name="what" maxlength="140" autocomplete="off">
      </label>
      <label class="field">Next step
        <input type="text" name="next" maxlength="140" autocomplete="off">
      </label>
    </div>
    <div class="ev-pane" data-ev="self_report">
      <p class="muted">You're confirming you did this in real life. It will be clearly labeled as self-reported.</p>
    </div>
    <p class="status-note">Saved as: <strong id="status-preview"></strong></p>
    <p class="error" id="log-error" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="modal-close">Cancel</button>
      <button type="submit" class="btn primary">Log action (+1 ⚡)</button>
    </div>
  </form>`;
}

export function syncLogForm(s) {
  const f = $('#log-form');
  if (!f) return;
  const mission = f.mission.value;
  const ev = f.querySelector('input[name="ev"]:checked').value;
  const isPersonal = mission === 'personal';
  const count = $('#log-count');
  count.disabled = !isPersonal;
  if (!isPersonal) count.value = 1;
  $('#count-help').textContent = isPersonal
    ? `Batch is fine — e.g. +${Math.max(1, Math.ceil(s.personalGoal.target / 2))} ${s.personalGoal.unit} with one screenshot of your tracker.`
    : 'Fixed at 1: log each distinct person or interaction separately.';
  f.querySelectorAll('.ev-pane').forEach((p) => { p.hidden = p.dataset.ev !== ev; });
  $('#status-preview').textContent = ev === 'screenshot' ? STATUS_LABELS.uploaded_unverified : STATUS_LABELS.self_reported;
}

export function missionInfoHTML(m) {
  const g = m.glossary ? GLOSSARY[m.glossary] : null;
  return `
    <div class="info-block accent-${m.accent}">
      <p><strong>${esc(m.name)}</strong>${m.task ? ` — this week: ${esc(m.task)}` : ''}</p>
      <h3>What it means</h3><p>${esc(m.definition)}</p>
      <h3>Example</h3><p>${esc(m.example)}</p>
      <h3>What doesn't count</h3><p>${esc(m.notCount)}</p>
      <h3>How it's counted</h3><p>${esc(m.counting)}</p>
      ${g ? `<p class="muted small">Glossary — <strong>${esc(g.term)}</strong>: ${esc(g.def)}</p>` : ''}
    </div>
    <div class="modal-actions"><button type="button" class="btn primary" data-action="log-open" data-mission="${m.id}">＋ Log this mission</button></div>`;
}

// Level stage label; Level 2 names the company you accepted (none yet → no company).
const stageText = (s, L) => fmt(s, s.offer ? L.stage : L.stage.replace(/ at \{oc\}/, ''), true);

// Quick-pick chips: clicking one fills the name / target / unit fields of the open form.
function goalPicksHTML() {
  return `<div class="goal-picks" role="group" aria-label="Quick picks"><span class="muted small">Quick picks:</span>
    ${PERSONAL_GOAL_PICKS.map((g, i) => `<button type="button" class="chip-btn" data-action="goal-pick" data-idx="${i}">${esc(g.name)} · ${g.target} ${esc(g.unit)}</button>`).join('')}</div>`;
}

export function levelGoalHTML(s, lvl) {
  const cur = s.personalGoal;
  const sug = LEVELS[lvl].suggestedPersonalGoal;
  const same = cur.name === sug.name && cur.target === sug.target && cur.unit === sug.unit;
  return `
  <form id="level-goal-form" novalidate>
    <p>Level ${lvl} · ${esc(LEVELS[lvl].title)} is starting. Alongside the two real-world missions, pick one personal goal for each week of this level. You can change it any time from the week panel.</p>
    <p class="muted small">Current goal: <strong>${esc(cur.name)} — ${cur.target} ${esc(cur.unit)} per week</strong></p>
    <div class="modal-actions left wrap">
      <button type="button" class="btn" data-action="goal-keep">Keep current goal</button>
      ${same ? '' : `<button type="button" class="btn primary" data-action="goal-suggested" data-autofocus>Use suggested: ${esc(sug.name)} · ${sug.target} ${esc(sug.unit)}</button>`}
    </div>
    <h3>Or set your own</h3>
    ${goalPicksHTML()}
    <label class="field">Goal name <input type="text" name="name" maxlength="60" value="${esc(sug.name)}" required></label>
    <div class="two">
      <label class="field">Weekly target <input type="number" name="target" min="1" max="10000" value="${sug.target}" required></label>
      <label class="field">Unit <input type="text" name="unit" maxlength="30" value="${esc(sug.unit)}" required></label>
    </div>
    <p class="error" id="level-goal-error" role="alert"></p>
    <div class="modal-actions"><button type="submit" class="btn primary">Save this goal</button></div>
  </form>`;
}

export function goalEditHTML(s) {
  const g = s.pendingPersonalGoal || s.personalGoal;
  return `
  <form id="goal-form" novalidate>
    <p class="muted">Your personal goal sits alongside the two system missions. Its target doesn't escalate week to week.</p>
    <label class="field">Goal name <input type="text" name="name" maxlength="60" value="${esc(g.name)}" required></label>
    <div class="two">
      <label class="field">Weekly target <input type="number" name="target" min="1" max="10000" value="${g.target}" required></label>
      <label class="field">Unit <input type="text" name="unit" maxlength="30" value="${esc(g.unit)}" required></label>
    </div>
    ${goalPicksHTML()}
    <label class="check"><input type="checkbox" name="applyNow"> Apply now (this week) instead of next week</label>
    <p class="error" id="goal-error" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="modal-close">Cancel</button>
      <button type="submit" class="btn primary">Save goal</button>
    </div>
  </form>`;
}

export function helpHTML() {
  const terms = Object.entries(GLOSSARY).map(([, g]) => `<dt>${esc(g.term)}</dt><dd>${esc(g.def)} <span class="muted">Example: ${esc(g.example)}</span></dd>`).join('');
  return `
    <h3>How to play</h3>
    <ol class="howto">
      <li>Each in-game week has <strong>5 days</strong>. Each day you get <strong>3 Energy</strong> and a daily event card.</li>
      <li>Spend leftover Energy on quick actions: <em>Deliver</em> (+Career Capital), <em>Connect</em> (+trust with one person), or <em>Rest</em> (save 1 Energy for tomorrow).</li>
      <li>After Day 5, the week's <strong>chapter</strong> waits behind the <strong>Reality Gate</strong>. Only real-world actions you log can open it.</li>
      <li>Every real action you log earns <strong>⚡ Momentum</strong>, which unlocks the strongest story choices.</li>
      <li>Earlier choices come back later: trust and favors can unlock options weeks afterward.</li>
    </ol>
    <div class="modal-actions left"><button type="button" class="btn small" data-action="intro-replay">Replay intro</button><button type="button" class="btn small ghost" data-action="real-sim">What's real vs. simulated</button></div>
    <h3>Glossary</h3>
    <dl class="glossary">${terms}</dl>`;
}

export function settingsHTML(s) {
  const a = s.accountability;
  queueTerm(s, 'accountabilityPartner');
  return `
  <form id="settings-form" novalidate>
    <label class="field">Your name (used in the story and email preview)
      <input type="text" name="playerName" maxlength="30" value="${esc(s.playerName)}" required>
    </label>
    <h3>Accountability partner <span class="muted small">(preview only)</span></h3>
    <p class="muted small">Someone who has agreed to get a short weekly summary. In this demo nothing is ever sent.</p>
    <div class="two">
      <label class="field">Partner name <input type="text" name="partnerName" maxlength="40" value="${esc(a.partnerName)}" autocomplete="off"></label>
      <label class="field">Partner email <input type="email" name="partnerEmail" maxlength="80" value="${esc(a.partnerEmail)}" autocomplete="off"></label>
    </div>
    <label class="check"><input type="checkbox" name="consent" ${a.consent ? 'checked' : ''}> My partner has explicitly agreed to receive weekly summaries</label>
    <label class="check"><input type="checkbox" name="paused" ${a.paused ? 'checked' : ''}> Pause weekly summaries</label>
    <p class="error" id="settings-error" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="email-preview">Preview weekly email</button>
      <button type="submit" class="btn primary">Save settings</button>
    </div>
  </form>
  <h3>Save data</h3>
  <p class="muted small">Your progress is stored only in this browser (localStorage). Each visitor has their own separate save.</p>
  <div class="modal-actions left">
    <button type="button" class="btn small" data-action="export-save">Export save (.json)</button>
    <label class="btn small file-btn">Import save<input type="file" id="import-file" accept="application/json,.json" hidden></label>
    <button type="button" class="btn small warn" data-action="reset-save">Reset save</button>
  </div>`;
}

export function emailHTML(s) {
  const e = accountabilityEmail(s);
  const warns = [];
  if (!e.hasPartner) warns.push('No partner set yet — add one in Settings.');
  if (!e.consent) warns.push('Partner consent is not confirmed. A real version would never send without it.');
  if (e.paused) warns.push('Summaries are paused. A real version would skip this week.');
  return `
    <div class="preview-banner" role="note">Preview only — nothing is sent.</div>
    ${warns.length ? `<ul class="warns">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    <pre class="email" id="email-text">${esc(e.text)}</pre>
    <p class="muted small">Built from your actual saved counts for the current week. Neutral wording, no judgment.</p>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="modal-close">Close</button>
      <button type="button" class="btn primary" data-action="copy-email">Copy to clipboard</button>
    </div>`;
}

export function levelsHTML(s) {
  return Object.entries(LEVELS).map(([n, L]) => {
    const lvl = Number(n);
    const unlocked = s.unlockedLevels.includes(lvl) && !L.futureScope;
    const current = s.level === lvl && s.phase !== 'levelComplete';
    const done = s.completedLevels.includes(lvl);
    const missions = L.missions.map((m) => esc(m.tag)).join(' + ');
    return `<div class="level-card ${unlocked ? '' : 'locked'}">
      <div><div class="kicker">Level ${lvl}${L.futureScope ? ' · Future scope' : ''}${done ? ' · Completed' : ''}</div>
      <h3>${esc(L.title)}</h3><p class="muted">${stageText(s, L)} · Missions: ${missions}</p></div>
      ${L.futureScope ? '<span class="badge">🔒 Coming later</span>'
        : current ? '<span class="badge st-passed">Current</span>'
          : unlocked ? `<button type="button" class="btn small primary" data-action="level-start" data-level="${lvl}">${done ? 'Replay' : 'Play'}</button>`
            : '<span class="badge">🔒 Finish Level 1</span>'}
    </div>`;
  }).join('') + '<p class="muted small">Pick the stage that matches your real situation. Switching levels keeps your history.</p>';
}

export function demoHTML(s) {
  const ms = getMissions(s);
  const opt = (n, v) => `<option value="${n}" ${n === v ? 'selected' : ''}>${n}</option>`;
  return `
    <p class="demo-note">Demo Mode is for testing. Everything here is <strong>simulated</strong> and labeled — no real outreach is recorded.</p>
    <h3>Jump</h3>
    <div class="three">
      <label class="field">Level <select id="d-level">${opt(1, s.level)}${opt(2, s.level)}${opt(3, s.level)}</select></label>
      <label class="field">Week <select id="d-week">${[1, 2, 3, 4, 5].map((n) => opt(n, s.week)).join('')}</select></label>
      <label class="field">Day <select id="d-day">${[1, 2, 3, 4, 5].map((n) => opt(n, s.day)).join('')}</select></label>
    </div>
    <div class="modal-actions left">
      <button type="button" class="btn small primary" data-action="demo-jump">Jump to day</button>
      <button type="button" class="btn small" data-action="demo-jump-gate">Jump to this week's Reality Gate</button>
      <button type="button" class="btn small" data-action="demo-prologue">Replay this level's prologue</button>
    </div>
    <h3>Mission counts (this week)</h3>
    <div class="three">${ms.map((m) => `<label class="field">${esc(m.tag)} <span class="muted small">/ ${m.target}</span><input type="number" min="0" max="10000" data-count="${m.id}" value="${m.actual}"></label>`).join('')}</div>
    <div class="modal-actions left">
      <button type="button" class="btn small" data-action="demo-set-counts">Set counts</button>
      <button type="button" class="btn small primary" data-action="demo-fill">Fill sample evidence (DEMO SAMPLE)</button>
      <button type="button" class="btn small" data-action="demo-momentum">+1 ⚡ (demo)</button>
    </div>
    <h3>Gate</h3>
    <label class="field">Gate rule
      <select id="d-rule">${Object.entries(GATE_RULES).map(([k, v]) => `<option value="${k}" ${k === s.gateRule ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
    </label>
    <label class="check"><input type="checkbox" id="d-force" ${s.forceGateFail ? 'checked' : ''}> Force gate fail</label>
    <h3>Story state</h3>
    <label class="field">Preset earlier choices (to see delayed callbacks)
      <select id="d-preset"><option value="">— keep current —</option>${Object.entries(STORY_PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.label)}</option>`).join('')}</select>
    </label>
    <div class="modal-actions left">
      <button type="button" class="btn small" data-action="demo-preset">Apply preset</button>
      <button type="button" class="btn small" data-action="demo-unlock">Unlock Level 2</button>
    </div>
    <h3>Choose offer</h3>
    <div class="two">
      <label class="field">Job offer (skips to Level 2 Week 1)
        <select id="d-offer">${CITY_ORDER.map((k) => `<option value="${k}" ${s.offer && s.offer.key === k ? 'selected' : ''}>${esc(CITIES[k].short)} — ${esc(CITIES[k].company)}</option>`).join('')}</select>
      </label>
      <label class="field">Random seed <input type="number" id="d-seed" value="${s.seed}" min="0" max="999999"></label>
    </div>
    <div class="modal-actions left">
      <button type="button" class="btn small primary" data-action="demo-offer">Start Level 2 with this offer</button>
      <button type="button" class="btn small" data-action="demo-seed">Set seed</button>
      <button type="button" class="btn small" data-action="demo-skills">Skills → 2 (demo)</button>
      <button type="button" class="btn small" data-action="demo-health">Health → 20 (demo)</button>
    </div>
    <h3>Choose Level 3 path</h3>
    <label class="field">Stay or relocate (starts Level 3 at its prologue)
      <select id="d-l3path"><option value="stay">Stay — promoted in ${esc(s.offer ? `${s.offer.company} (${s.offer.city})` : 'your Level 2 city')}</option>${CITY_ORDER.filter((k) => !s.offer || k !== s.offer.key).map((k) => `<option value="${k}" ${s.level3Path && !s.level3Path.stayed && s.level3Path.key === k ? 'selected' : ''}>Relocate — ${esc(CITIES[k].l3.role)}, ${esc(CITIES[k].company)} (${esc(CITIES[k].short)})</option>`).join('')}</select>
    </label>
    <div class="modal-actions left"><button type="button" class="btn small primary" data-action="demo-l3path">Start Level 3 with this path</button></div>
    <p class="muted small">Offer: ${s.offer ? esc(`${s.offer.company} (${s.offer.city})`) : 'none yet'} · Health ${s.health} · Skills ${Object.entries(s.skills).map(([k, v]) => `${esc(SKILLS[k])} ${v}`).join(', ')}<br>
      Flags: ${s.flags.length ? esc(s.flags.join(', ')) : 'none'} · Trust: ${Object.entries(s.trust).map(([k, v]) => `${esc(charName(k))} ${v}`).join(', ')}</p>
    <div class="modal-actions">
      <button type="button" class="btn small warn" data-action="reset-save">Reset save</button>
      <button type="button" class="btn small ghost" data-action="demo-off">Turn off Demo Mode</button>
    </div>`;
}

export function realSimHTML() {
  return `
    <div class="two-col-list">
      <div><h3>Real</h3><ul>
        <li>The weekly missions — they're about things you do in real life.</li>
        <li>The counts and evidence you log (stored only in this browser).</li>
        <li>The Reality Gate: only logged real actions (or a visible Grace Pass) open chapters.</li>
        <li>⚡ Momentum — earned only by logging real actions.</li>
      </ul></div>
      <div><h3>Simulated</h3><ul>
        <li>The whole story: characters, ${esc(COMPANY)}, interviews, and the job offer are fiction.</li>
        <li>Professor Mercer is a fictional mentor. His lines are written for the game and don't quote any real lecture.</li>
        <li>Evidence is <em>not verified</em>: statuses are “uploaded · unverified” or “self-reported.” A screenshot doesn't prove a message was delivered.</li>
        <li>The accountability email is a preview. Nothing is sent, ever, in this demo.</li>
        <li>Demo Mode data is labeled DEMO SAMPLE / demo.</li>
      </ul></div>
    </div>
    <p class="muted small">No servers, no accounts, no AI calls. Screenshots never leave your device and aren't stored — only their file name, size, and type.</p>`;
}

const INTRO = [
  {
    title: 'Welcome to Network Quest',
    body: (s) => `<p>You'll play <strong>${esc(s.playerName)}</strong>, a final-semester MSBA student, through a <strong>fictional</strong> career story — job search first, then a first job as a Data Analyst.</p>
      <p>Everything in the story (characters, the firm, the offer) is made up. The point is the decisions — and what you do <em>outside</em> the game.</p>`,
  },
  {
    title: 'Play a day',
    body: () => `<p>Each in-game week has <strong>5 days</strong>. Each day you get <strong>3 Energy</strong> and an event card with trade-offs.</p>
      <p>Choices move three meters — <strong>Career Capital</strong>, <strong>Network Strength</strong>, <strong>Influence</strong> — and how much people trust you. Some choices come back weeks later.</p>`,
  },
  {
    title: 'Real actions unlock chapters',
    body: () => `<p>Each week has <strong>two real-world missions</strong> (e.g. reach out to a new professional) plus <strong>one personal goal</strong> you choose. Each level suggests one (job applications, then the gym, then a course), and you can change it any time.</p>
      <p>After Day 5, the week's chapter sits behind a <strong>Reality Gate</strong>. Only real actions you log can open it. Each logged action also earns <strong>⚡ Momentum</strong> for the strongest story choices.</p>
      <p class="muted">Game choices never count toward real missions.</p>`,
  },
  {
    title: "What's real, what's simulated",
    body: () => `<ul>
      <li>Your logs stay in this browser. Screenshots are checked for type/size, then <strong>discarded</strong> — only file name and size are saved.</li>
      <li>Evidence is labeled <em>unverified</em> or <em>self-reported</em>. Nothing is checked by AI.</li>
      <li>The accountability email is a <strong>preview only</strong>; nothing is sent.</li>
      <li>Short on time? <strong>Demo Mode</strong> (bottom-right) jumps to any week and fills labeled sample data.</li></ul>`,
  },
];

export function introHTML(s, step) {
  const it = INTRO[step];
  const dots = INTRO.map((_, i) => `<span class="dot${i === step ? ' on' : ''}"></span>`).join('');
  return {
    title: `${it.title} <span class="muted small">(${step + 1}/${INTRO.length})</span>`,
    body: `<div class="intro">${it.body(s)}</div>
      <div class="intro-foot">
        <div class="dots" aria-hidden="true">${dots}</div>
        <div class="modal-actions">
          ${step > 0 ? '<button type="button" class="btn ghost" data-action="intro-back">Back</button>' : '<button type="button" class="btn ghost" data-action="intro-skip">Skip</button>'}
          <button type="button" class="btn primary" data-action="intro-next" data-step="${step}" data-autofocus>${step === INTRO.length - 1 ? 'Start Week 1' : 'Next'}</button>
        </div>
      </div>`,
    last: step === INTRO.length - 1,
  };
}
export const INTRO_STEPS = INTRO.length;
