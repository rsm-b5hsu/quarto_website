// Game engine: day loop, energy, health, skills, events, activities, favors (trust as currency),
// dialogue lines, chapter scenes and the Level 1 offer decision.
// Nothing in here touches real-world mission counts — game choices never count.
import { EVENTS, CHAPTERS, FLAG_NOTES } from '../data/scenes.js';
import { ALLY_POOL, CAST, CONTACTS, CHARACTERS, L2_NETWORK } from '../data/characters.js';
import { ACTIVITIES, ACTIVITY_BY_ID, DAILY_ACTIVITY_COUNT } from '../data/activities.js';
import { CITIES, CITY_ORDER, DEFAULT_CITY, RELOCATE_FILL } from '../data/cities.js';
import { PROLOGUES } from '../data/prologues.js';
import { rng, pick, weightedSample } from './rng.js';

export const BASE_ENERGY = 3;
export const MAX_ENERGY = 4;
export const MAX_MOMENTUM = 5;
export const DAYS_PER_WEEK = 5;
export const WEEKS_PER_LEVEL = 5;
export const LOW_HEALTH = 30;
export const MAX_SKILL = 3;

export const METER_KEYS = { cc: 'careerCapital', ns: 'networkStrength', inf: 'influence' };
export const METER_NAMES = { cc: 'Career Capital', ns: 'Network Strength', inf: 'Influence' };
export const SKILLS = { communication: 'Communication', persuasion: 'Persuasion', teamwork: 'Teamwork' };
export const RES_NAMES = { morale: 'Team Morale', pc: 'Political Capital' };
const RES_KEYS = { morale: 'morale', pc: 'political' };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- Offer / city helpers ---------- */

export function offerCity(s) {
  return s.offer && CITIES[s.offer.key] ? CITIES[s.offer.key] : null;
}
// Level 3 city (stay = your Level 2 city; relocate = the new one).
export function l3City(s) {
  return s.level3Path && CITIES[s.level3Path.key] ? CITIES[s.level3Path.key] : offerCity(s);
}
// The city that shapes the current level (none in Level 1).
export function currentCity(s) {
  if (s.level >= 3) return l3City(s);
  if (s.level >= 2) return offerCity(s);
  return null;
}
// Company for the current level ({co}).
export function currentCompany(s) {
  if (s.level >= 3 && s.level3Path) return s.level3Path.company;
  if (s.level >= 2 && s.offer) return s.offer.company;
  return null;
}
// City modifiers apply from Level 2 on.
export function cityMods(s) {
  const c = currentCity(s);
  return c ? c.l2.mods || {} : {};
}

/* ---------- Relationships ---------- */

export function allies(s) {
  return (ALLY_POOL[s.level] || []).filter((id) => (s.trust[id] || 0) >= 3).length;
}
export const metContacts = (s, level = s.level) => (CONTACTS[level] || []).filter((id) => s.contacts.includes(id));
// Everyone you can have a relationship with this level.
export const knownPeople = (s) => [...(CAST[s.level] || []), ...(s.level >= 3 ? L2_NETWORK : []), ...metContacts(s)];

// Threshold after city adjustments (Seattle: Influence checks are harder in Level 2).
export function meterNeed(s, m, n) {
  const mods = cityMods(s);
  return m === 'inf' && mods.infCheckAdj ? n + mods.infCheckAdj : n;
}

export function checkCond(s, c) {
  if (!c) return true;
  if (c.all) return c.all.every((x) => checkCond(s, x));
  if (c.any) return c.any.some((x) => checkCond(s, x));
  if (c.not) return !checkCond(s, c.not);
  if (c.flag) return s.flags.includes(c.flag);
  if (c.notFlag) return !s.flags.includes(c.notFlag);
  if (c.trustGte) return (s.trust[c.trustGte[0]] || 0) >= c.trustGte[1];
  if (c.meterGte) return (s.meters[METER_KEYS[c.meterGte[0]]] || 0) >= meterNeed(s, c.meterGte[0], c.meterGte[1]);
  if (c.skillGte) return (s.skills[c.skillGte[0]] || 0) >= c.skillGte[1];
  if (c.alliesGte != null) return allies(s) >= c.alliesGte;
  if (c.contactsGte != null) return metContacts(s).length >= c.contactsGte;
  if (c.offer) return !!s.offer && s.offer.key === c.offer;
  if (c.moraleGte != null) return (s.morale || 0) >= c.moraleGte;
  if (c.pcGte != null) return (s.political || 0) >= c.pcGte;
  return true;
}

// Plain-language reasons a (satisfied) condition is true. Strings may contain {c:id} tokens.
export function explainCond(s, c) {
  if (!c) return [];
  if (c.all) return c.all.flatMap((x) => explainCond(s, x));
  if (c.any) { const hit = c.any.find((x) => checkCond(s, x)); return hit ? explainCond(s, hit) : []; }
  if (c.flag) return [FLAG_NOTES[c.flag] || c.flag.replace(/_/g, ' ')];
  if (c.trustGte) return [`trust with {c:${c.trustGte[0]}} is ${c.trustGte[1]}+`];
  if (c.meterGte) return [`your ${METER_NAMES[c.meterGte[0]]} is ${meterNeed(s, c.meterGte[0], c.meterGte[1])}+`];
  if (c.skillGte) return [`your ${SKILLS[c.skillGte[0]]} skill is ${c.skillGte[1]}+`];
  if (c.alliesGte != null) return ['you have {allies} cross-team allies (trust 3+)'];
  if (c.offer) return [`you chose ${CITIES[c.offer] ? CITIES[c.offer].short : c.offer}`];
  if (c.moraleGte != null) return [`your Team Morale is ${c.moraleGte}+`];
  if (c.pcGte != null) return [`your Political Capital is ${c.pcGte}+`];
  return [];
}

// Capability checks inside a condition: meters, skills, trust, allies, contacts.
export function capabilityNeeds(s, c, out = []) {
  if (!c) return out;
  if (c.all) c.all.forEach((x) => capabilityNeeds(s, x, out));
  else if (c.any) c.any.forEach((x) => capabilityNeeds(s, x, out));
  else if (c.meterGte) {
    const [m, n0] = c.meterGte;
    const n = meterNeed(s, m, n0);
    const have = s.meters[METER_KEYS[m]] || 0;
    out.push({ kind: 'meter', meter: m, label: METER_NAMES[m], need: n, have, ok: have >= n });
  } else if (c.skillGte) {
    const [k, n] = c.skillGte;
    const have = s.skills[k] || 0;
    out.push({ kind: 'skill', skill: k, label: `${SKILLS[k]} skill`, need: n, have, ok: have >= n });
  } else if (c.trustGte) {
    const [id, n] = c.trustGte;
    const have = s.trust[id] || 0;
    out.push({ kind: 'trust', id, label: `Trust with {c:${id}}`, need: n, have, ok: have >= n });
  } else if (c.alliesGte != null) {
    const have = allies(s);
    out.push({ kind: 'allies', label: 'Cross-team allies', need: c.alliesGte, have, ok: have >= c.alliesGte });
  } else if (c.contactsGte != null) {
    const have = metContacts(s).length;
    out.push({ kind: 'contacts', label: 'New contacts met', need: c.contactsGte, have, ok: have >= c.contactsGte });
  } else if (c.moraleGte != null) {
    const have = s.morale || 0;
    out.push({ kind: 'res', res: 'morale', label: 'Team Morale', need: c.moraleGte, have, ok: have >= c.moraleGte });
  } else if (c.pcGte != null) {
    const have = s.political || 0;
    out.push({ kind: 'res', res: 'pc', label: 'Political Capital', need: c.pcGte, have, ok: have >= c.pcGte });
  }
  return out;
}

const needText = (n) => `${n.label} ${n.need}+ (you: ${n.have})`;

export function resolveVariant(s, v) {
  if (v == null) return { text: '', notes: [] };
  if (typeof v === 'string') return { text: v, notes: [] };
  if (Array.isArray(v)) {
    for (const o of v) if (!o.if || checkCond(s, o.if)) return { text: o.text, notes: explainCond(s, o.if) };
    return { text: '', notes: [] };
  }
  return { text: v.text || '', notes: explainCond(s, v.if) };
}
export const pickVariant = (s, v) => resolveVariant(s, v).text;

/* ---------- Dialogue lines ---------- */

function makeLine(s, l, notes) {
  const out = { speaker: l.speaker || 'narrator', text: l.text || '' };
  if (l.expression) out.expression = l.expression;
  if (l.kind) out.kind = l.kind;
  if (notes && notes.length) out.notes = notes;
  return out;
}

// Lines that come from data/cities.js for the chosen offer.
function insertLines(s, what) {
  if (what === 'networkRecap') return networkRecap(s);
  if (what.startsWith('l3')) {
    const c3 = l3City(s) || CITIES[DEFAULT_CITY];
    const pro = c3.l3.prologue || {};
    if (what === 'l3Arrival') return resolveLines(s, pro.arrival || []);
    if (what === 'l3Office') return resolveLines(s, pro.office || []);
    if (what === 'l3Evening') return resolveLines(s, pro.evening || []);
    if (what === 'l3Stakes') return resolveLines(s, pro.stakes || []);
    if (what === 'l3Referral') return c3.l3.referral ? [{ speaker: 'narrator', text: c3.l3.referral }] : [];
    if (what === 'l3Twist') return resolveLines(s, c3.l3.twist.lines);
    return [];
  }
  const city = offerCity(s) || CITIES[DEFAULT_CITY];
  if (what === 'offerIntro') return resolveLines(s, city.l2.intro);
  if (what === 'uncertainty') return resolveLines(s, city.l2.uncertainty.lines);
  const pro = city.l2.prologue || {};
  if (what === 'cityOffice') return resolveLines(s, pro.office || []);
  if (what === 'cityEvening') return resolveLines(s, pro.evening || []);
  if (what === 'cityStakes') return resolveLines(s, pro.stakes || []);
  return [];
}

function expandEntry(s, e) {
  if (e.insert) return insertLines(s, e.insert);
  const notes = explainCond(s, e.if);
  if (e.lines) {
    const ls = resolveLines(s, e.lines);
    if (ls.length && notes.length) ls[0].notes = [...notes, ...(ls[0].notes || [])];
    return ls;
  }
  return [makeLine(s, e, notes)];
}

// Resolve authored lines into a flat list of { speaker, text, expression?, notes? }.
export function resolveLines(s, content) {
  if (content == null) return [];
  if (typeof content === 'string') {
    return content.split(/\n\n/).filter(Boolean).map((t) => ({ speaker: 'narrator', text: t }));
  }
  const out = [];
  for (const item of content) {
    if (Array.isArray(item)) {
      const hit = item.find((e) => !e.if || checkCond(s, e.if));
      if (hit) out.push(...expandEntry(s, hit));
    } else if (item && (!item.if || checkCond(s, item.if))) {
      out.push(...expandEntry(s, item));
    }
  }
  return out;
}

export function seanLine(ch) {
  return ch.say ? { speaker: 'sean', text: ch.say, expression: ch.sayExpression || 'neutral' }
    : { speaker: 'sean', text: ch.label, kind: 'action' };
}

const newDialog = (lines) => ({ lines, shown: Math.min(1, lines.length) });
export const dialogDone = (d) => !d || d.shown >= d.lines.length;

export function activeDialog(s) {
  if (s.phase === 'prologue') return s.prologue ? s.prologue.dialog : null;
  if (s.phase === 'day') return s.eventResult || s.eventDialog;
  if (s.phase === 'scene' && s.scene) {
    if (s.scene.review === 'talk') return s.scene.reviewDialog;
    if (s.scene.review) return null;
    return s.scene.result || s.scene.dialog;
  }
  return null;
}

export function advanceLine(s) {
  const d = activeDialog(s);
  if (!d || dialogDone(d)) return false;
  d.shown += 1;
  return true;
}

export function revealAll(s) {
  const d = activeDialog(s);
  if (!d || dialogDone(d)) return false;
  d.shown = d.lines.length;
  return true;
}

// "Your network" recap at the start of Level 3: allies help, distant ties may get in the way.
export function networkSummary(s) {
  const far = s.flags.includes('l3_relocated');
  return L2_NETWORK.map((id) => {
    const tr = s.trust[id] || 0;
    const status = tr >= 3 ? 'ally' : tr <= 1 ? 'distant' : 'neutral';
    return { id, trust: tr, status, longDistance: far };
  });
}
const RECAP_HELP = {
  ted: 'can sponsor you with leadership', ben: 'can vouch for your numbers in budget season',
  jihee: 'can co-sponsor requests from Marketing', shalini: 'can unblock data and give early warnings',
};
function networkRecap(s) {
  const lines = networkSummary(s).map((n) => {
    const name = `{c:${n.id}}`;
    const far = n.longDistance ? ' (long-distance now)' : '';
    if (n.status === 'ally') return { speaker: 'narrator', text: `${name} — trust ${n.trust}, an ally${far}. ${name} ${RECAP_HELP[n.id]}.` };
    if (n.status === 'distant') return { speaker: 'narrator', text: `${name} — trust ${n.trust}, distant${far}. This relationship may slow you down when you need help.` };
    return { speaker: 'narrator', text: `${name} — trust ${n.trust}, friendly but not yet an ally${far}.` };
  });
  return lines;
}

/* ---------- Choices, favors ---------- */

// Trust a favor costs right now (reciprocity: −1 if you helped them before, min 1).
export function favorCost(s, ch) {
  if (!ch.favor) return 0;
  const helped = s.helped.includes(ch.favor.npc);
  const far = s.level >= 3 && s.flags.includes('l3_relocated') && L2_NETWORK.includes(ch.favor.npc) ? 1 : 0;
  return Math.max(1, ch.favor.cost - (helped ? 1 : 0) + far);
}
export const isLongDistance = (s, id) => s.level >= 3 && s.flags.includes('l3_relocated') && L2_NETWORK.includes(id);

// The full requirement of a choice: its `requires` plus the favor's trust threshold.
export function choiceRequires(ch) {
  const parts = [];
  if (ch.requires) parts.push(ch.requires);
  if (ch.favor) parts.push({ trustGte: [ch.favor.npc, ch.favor.need] });
  return parts.length === 0 ? null : parts.length === 1 ? parts[0] : { all: parts };
}

// Whether a choice is selectable, and why not. Locked choices are always shown.
export function choiceState(s, ch, useEnergy) {
  const req = choiceRequires(ch);
  if (req && !checkCond(s, req)) {
    const needs = capabilityNeeds(s, req).filter((n) => !n.ok);
    const auto = needs.length ? `Needs ${needs.map(needText).join(' and ')}` : 'Not available yet.';
    return { visible: true, available: false, reason: ch.lockedHint || auto, needs };
  }
  if (ch.momentum && s.momentum < ch.momentum) {
    return { visible: true, available: false, reason: `Needs ⚡${ch.momentum} Momentum — earn it by logging a real-world action.` };
  }
  if (useEnergy && (ch.cost || 0) > s.energy) {
    return { visible: true, available: false, reason: 'Not enough Energy today.' };
  }
  return { visible: true, available: true, reason: '' };
}

/* ---------- Effects ---------- */

function pickContact(s, r) {
  const pool = (CONTACTS[s.level] || []).filter((id) => !s.contacts.includes(id));
  return pick(pool, r);
}

export function applyEffects(s, eff = {}, r = Math.random) {
  const deltas = [];
  for (const [short, key] of Object.entries(METER_KEYS)) {
    if (!eff[short]) continue;
    const before = s.meters[key];
    s.meters[key] = clamp(before + eff[short], 0, 100);
    if (s.meters[key] !== before) deltas.push({ kind: 'meter', key, value: s.meters[key] - before });
  }
  if (eff.health) {
    const bonus = eff.health > 0 && cityMods(s).healthRecovery ? cityMods(s).healthRecovery : 0;
    const before = s.health;
    s.health = clamp(before + eff.health + bonus, 0, 100);
    if (s.health !== before) deltas.push({ kind: 'health', value: s.health - before });
  }
  for (const [k, key] of Object.entries(RES_KEYS)) {
    if (!eff[k]) continue;
    const before = s[key] || 0;
    s[key] = clamp(before + eff[k], 0, 100);
    if (s[key] !== before) deltas.push({ kind: 'res', res: k, value: s[key] - before });
  }
  if (eff.later) {
    if (!Array.isArray(s.delayed)) s.delayed = [];
    for (const l of eff.later) s.delayed.push({ level: s.level, due: s.week + l.weeks, effects: l.effects, text: l.text });
    deltas.push({ kind: 'later', value: eff.later.length });
  }
  if (eff.skill) {
    for (const [k, v] of Object.entries(eff.skill)) {
      const before = s.skills[k] || 0;
      s.skills[k] = clamp(before + v, 0, MAX_SKILL);
      if (s.skills[k] !== before) deltas.push({ kind: 'skill', skill: k, value: s.skills[k] - before });
      else if (v > 0) deltas.push({ kind: 'skillMax', skill: k, value: 0 });
    }
  }
  if (eff.trust) {
    for (const [id, v] of Object.entries(eff.trust)) {
      const before = s.trust[id] || 0;
      s.trust[id] = clamp(before + v, 0, 5);
      if (s.trust[id] !== before) deltas.push({ kind: 'trust', id, value: s.trust[id] - before });
      else if (v > 0) deltas.push({ kind: 'trustMax', id, value: 0 });
    }
  }
  if (eff.newContact) {
    const id = pickContact(s, r);
    if (id) {
      s.contacts.push(id);
      s.trust[id] = Math.max(s.trust[id] || 0, cityMods(s).contactTrust || 1);
      deltas.push({ kind: 'contact', id, value: s.trust[id] });
    } else {
      // Everyone here is already a contact: deepen one relationship instead.
      const known = metContacts(s);
      const k = pick(known, r);
      if (k && s.trust[k] < 5) { s.trust[k] += 1; deltas.push({ kind: 'trust', id: k, value: 1 }); }
    }
  }
  if (eff.trustRandom) {
    const known = knownPeople(s).filter((id) => (s.trust[id] || 0) < 5);
    const id = pick(known, r);
    if (id) {
      s.trust[id] = clamp((s.trust[id] || 0) + eff.trustRandom, 0, 5);
      deltas.push({ kind: 'trust', id, value: eff.trustRandom });
    }
  }
  if (eff.helped) for (const id of eff.helped) if (!s.helped.includes(id)) s.helped.push(id);
  if (eff.flags) for (const f of eff.flags) if (!s.flags.includes(f)) s.flags.push(f);
  if (eff.carry && s.carry < 1) {
    s.carry = 1;
    deltas.push({ kind: 'carry', value: 1 });
  }
  return deltas;
}

// Spend trust for a favor; returns deltas.
function spendFavor(s, ch) {
  if (!ch.favor) return [];
  const cost = favorCost(s, ch);
  const id = ch.favor.npc;
  const before = s.trust[id] || 0;
  s.trust[id] = clamp(before - cost, 0, 5);
  return [{ kind: 'favor', id, value: s.trust[id] - before }];
}

/* ---------- Weekly ledger (feeds the end-of-week review) ---------- */

const meterGains = (deltas) => {
  const g = {};
  for (const d of deltas) {
    if (d.kind === 'meter') {
      const short = Object.keys(METER_KEYS).find((k) => METER_KEYS[k] === d.key);
      g[short] = (g[short] || 0) + d.value;
    } else if (d.kind === 'res') g[d.res] = (g[d.res] || 0) + d.value;
  }
  return g;
};
const pickMeters = (eff = {}) => Object.fromEntries(Object.keys(METER_KEYS).filter((k) => eff[k]).map((k) => [k, eff[k]]));

function record(s, src, title, choices, idx) {
  if (!Array.isArray(s.weekLedger)) s.weekLedger = [];
  const ch = choices[idx];
  s.weekLedger.push({
    src, title, label: ch.label, gains: {},
    alts: choices.map((c, i) => {
      if (i === idx) return null;
      const st = choiceState(s, c, false);
      const req = choiceRequires(c);
      return { label: c.label, eff: pickMeters(c.effects), momentum: c.momentum || 0, locked: st.available ? null : st.reason, hidden: false, needs: req ? capabilityNeeds(s, req) : [] };
    }).filter(Boolean),
    checks: choices.map((c) => ({ label: c.label, req: choiceRequires(c) })).filter((c) => c.req)
      .map((c) => ({ label: c.label, needs: capabilityNeeds(s, c.req) })).filter((c) => c.needs.length),
  });
}

/* ---------- Day loop ---------- */

export function getEvent(s) {
  return (EVENTS[s.level] || []).find((e) => e.id === s.currentEventId) || null;
}

export function weekPool(level, week) {
  const all = EVENTS[level] || [];
  const pool = all.filter((e) => !e.weeks || e.weeks.includes(week));
  return pool.length ? pool : all;
}

const dayRng = (s, ...extra) => rng(s.seed, s.run, s.level, s.week, s.day, s.overtime ? `o${s.usedEventIds.length}` : '', ...extra);

// Today's activities: 5 cards, Rest always included, weighted by city in Level 2.
export function drawActivities(s) {
  const r = dayRng(s, 'acts');
  const all = ACTIVITIES.filter((a) => !a.levels || a.levels.includes(s.level));
  const rest = all.find((a) => a.always);
  const others = all.filter((a) => !a.always);
  const city = currentCity(s);
  const w = (a) => {
    if (!city) return 1;
    const ws = city.l2.activityWeights || {};
    return a.tags.reduce((m, t) => m * (ws[t] || 1), 1);
  };
  const picked = weightedSample(others, w, DAILY_ACTIVITY_COUNT - 1, r);
  return [rest, ...picked].filter(Boolean).map((a) => a.id);
}

export function startDay(s) {
  const lowHealth = s.health < LOW_HEALTH;
  s.energy = Math.min(MAX_ENERGY, BASE_ENERGY + (s.carry || 0)) - (lowHealth ? 1 : 0);
  s.energy = Math.max(1, s.energy);
  s.dayEnergy = s.energy;
  s.lowHealthToday = lowHealth;
  s.carry = 0;
  s.eventResult = null;
  s.dayLog = [];
  const drain = cityMods(s).healthDrain;
  if (drain) s.health = clamp(s.health - drain, 0, 100);

  const r = dayRng(s, 'event');
  const pool = weekPool(s.level, s.week);
  let avail = pool.filter((e) => !s.usedEventIds.includes(e.id));
  if (!avail.length) { s.usedEventIds = []; avail = pool.slice(); }
  const themed = avail.filter((e) => e.weeks);
  const draw = themed.length && r() < 0.7 ? themed : avail;
  const ev = pick(draw, r);
  s.currentEventId = ev ? ev.id : null;
  if (ev) s.usedEventIds.push(ev.id);
  s.eventDialog = newDialog(ev ? resolveLines(s, ev.lines) : []);
  s.dayActs = drawActivities(s);
}

export function ensureEventDialog(s) {
  if (s.phase !== 'day') return;
  const ev = getEvent(s);
  if (ev && (!s.eventDialog || !Array.isArray(s.eventDialog.lines))) {
    s.eventDialog = { lines: resolveLines(s, ev.lines), shown: 0 };
    s.eventDialog.shown = s.eventDialog.lines.length;
  }
  if (s.eventResult && !Array.isArray(s.eventResult.lines)) {
    s.eventResult.lines = [{ speaker: 'narrator', text: s.eventResult.text || '' }];
    s.eventResult.shown = 1;
  }
  if (!Array.isArray(s.dayActs) || !s.dayActs.length) s.dayActs = drawActivities(s);
}

export function chooseEvent(s, idx) {
  const ev = getEvent(s);
  if (!ev || s.eventResult || !dialogDone(s.eventDialog)) return false;
  const ch = ev.choices[idx];
  if (!ch || !choiceState(s, ch, true).available) return false;
  const deltas = [];
  if (ch.cost) { s.energy -= ch.cost; deltas.push({ kind: 'energy', value: -ch.cost }); }
  if (ch.momentum) { s.momentum -= ch.momentum; deltas.push({ kind: 'momentum', value: -ch.momentum }); }
  const lines = [seanLine(ch), ...resolveLines(s, ch.result)];
  record(s, 'event', ev.title, ev.choices, idx);
  deltas.push(...spendFavor(s, ch));
  deltas.push(...applyEffects(s, ch.effects, dayRng(s, 'eff', idx)));
  s.weekLedger[s.weekLedger.length - 1].gains = meterGains(deltas);
  s.eventResult = { choice: idx, lines, shown: 1, deltas };
  return true;
}

/* ---------- Activities ---------- */

// Outcome table with the city's adjustments (Seattle: social activities succeed more often).
export function activityOutcomes(s, act) {
  const bonus = act.tags.includes('social') ? (cityMods(s).socialBonus || 0) : 0;
  if (!bonus || act.outcomes.length < 2) return act.outcomes;
  const good = act.outcomes.filter((o) => o.good);
  const bad = act.outcomes.filter((o) => !o.good);
  const shift = Math.min(bonus, bad.reduce((a, o) => a + o.p, 0));
  return act.outcomes.map((o) => ({
    ...o,
    p: o.good ? o.p + shift * (o.p / good.reduce((a, x) => a + x.p, 0)) : o.p - shift * (o.p / bad.reduce((a, x) => a + x.p, 0)),
  }));
}

export function activityState(s, act) {
  if (s.dayLog.some((e) => e.id === act.id)) return { available: false, reason: 'Done today.' };
  if (act.requires && !checkCond(s, act.requires)) return { available: false, reason: act.lockedHint || 'Not available yet.' };
  if (act.energy > s.energy) return { available: false, reason: `Needs ${act.energy} Energy.` };
  return { available: true, reason: '' };
}

export function doActivity(s, id) {
  const act = ACTIVITY_BY_ID[id];
  if (!act || s.phase !== 'day' || !s.eventResult || !dialogDone(s.eventResult)) return false;
  if (!s.dayActs.includes(id) || !activityState(s, act).available) return false;
  const r = dayRng(s, 'roll', id);
  const outs = activityOutcomes(s, act);
  let x = r(); let o = outs[outs.length - 1];
  for (const cand of outs) { if (x < cand.p) { o = cand; break; } x -= cand.p; }
  s.energy -= act.energy;
  const deltas = [{ kind: 'energy', value: -act.energy }, ...applyEffects(s, o.effects, r)];
  let consolation = null;
  if (!o.good && o.consolation && r() < o.consolation.chance) {
    consolation = o.consolation.text;
    deltas.push(...applyEffects(s, o.consolation.effects, r));
  }
  const entry = { type: 'activity', id, good: !!o.good, label: o.label, text: o.text, reason: o.reason || '', consolation, deltas };
  s.dayLog.push(entry);
  if (!Array.isArray(s.weekLedger)) s.weekLedger = [];
  s.weekLedger.push({ src: 'activity', type: id, label: act.name, good: !!o.good, gains: meterGains(deltas) });
  return entry;
}

export function endDay(s) {
  if (s.phase !== 'day' || !s.eventResult) return false;
  if (s.overtime) {
    s.overtime = false;
    s.phase = 'gate';
    s.currentEventId = null;
    return true;
  }
  if (s.day >= DAYS_PER_WEEK) {
    s.phase = 'gate';
    s.currentEventId = null;
    return true;
  }
  s.day += 1;
  startDay(s);
  return true;
}

export function playBonusDay(s) {
  if (s.phase !== 'gate') return false;
  s.overtime = true;
  s.phase = 'day';
  startDay(s);
  return true;
}

/* ---------- Level prologue (background story before Week 1) ---------- */

export const getPrologue = (s) => PROLOGUES[s.level] || null;

export function startPrologue(s) {
  const p = getPrologue(s);
  if (!p) { s.phase = 'day'; startDay(s); return false; }
  s.phase = 'prologue';
  s.week = 1; s.day = 1;
  s.currentEventId = null; s.eventResult = null; s.eventDialog = null;
  s.prologue = { level: s.level, dialog: newDialog(resolveLines(s, p.lines)) };
  return true;
}

export function ensurePrologue(s) {
  if (s.phase !== 'prologue') return;
  if (!s.prologue || s.prologue.level !== s.level || !s.prologue.dialog || !Array.isArray(s.prologue.dialog.lines)) startPrologue(s);
}

export function finishPrologue(s) {
  if (s.phase !== 'prologue' || !s.prologue || !dialogDone(s.prologue.dialog)) return false;
  s.prologue = null;
  s.phase = 'day';
  startDay(s);
  return true;
}

/* ---------- Offers (end of Level 1) ---------- */

// Which 3 offers you get, and which company didn't make an offer (and why).
export function offersFor(s) {
  const eligible = (k) => !CITIES[k].eligible || checkCond(s, CITIES[k].eligible);
  const offered = ['atlanta'];
  for (const k of ['phoenix', 'nyc', 'seattle']) if (offered.length < 3 && eligible(k)) offered.push(k);
  for (const k of ['seattle', 'nyc']) if (offered.length < 3 && !offered.includes(k)) offered.push(k);
  const missing = CITY_ORDER.find((k) => !offered.includes(k));
  const reason = missing ? (eligible(missing)
    ? `You qualified, but ${CITIES[missing].company} filled the role before your other offers came in.`
    : CITIES[missing].notOfferedReason) : '';
  return { offered: CITY_ORDER.filter((k) => offered.includes(k)), missing, reason };
}

function offerChoices(s) {
  const { offered, missing, reason } = offersFor(s);
  const out = offered.map((k) => {
    const c = CITIES[k];
    return {
      label: `Accept ${c.company} — ${c.city}`, offer: k,
      say: `I'd like to accept the ${c.role} role at ${c.company}.`,
      effects: { flags: [`offer_${k}`] },
      result: [
        { speaker: 'narrator', text: `You sign with ${c.company} in ${c.city}. ${c.industry}.` },
        { speaker: 'narrator', text: 'No option was best on every row. You chose the trade-offs you can live with — that is the decision.' },
      ],
    };
  });
  if (missing) {
    const c = CITIES[missing];
    out.push({ label: `${c.company} — ${c.city}`, offer: missing, notOffered: true, requires: { flag: '__never__' }, lockedHint: `Not offered: ${reason}`, effects: {} });
  }
  return out;
}

/* ---------- Level 3 path (end of Level 2): stay or relocate ---------- */

export function pathsFor(s) {
  const cur = (s.offer && s.offer.key) || DEFAULT_CITY;
  const others = RELOCATE_FILL.filter((k) => k !== cur);
  const eligible = (k) => !CITIES[k].l3.eligible || checkCond(s, CITIES[k].l3.eligible);
  const reloc = [];
  for (const k of others) if (reloc.length < 2 && eligible(k)) reloc.push(k);
  for (const k of others) if (reloc.length < 2 && !reloc.includes(k)) reloc.push(k);
  const missing = others.find((k) => !reloc.includes(k));
  const reason = missing ? (eligible(missing)
    ? `You qualified, but ${CITIES[missing].company} filled the role first.`
    : CITIES[missing].l3.notOfferedReason) : '';
  return { current: cur, relocate: CITY_ORDER.filter((k) => reloc.includes(k)), missing, reason, earned: reloc.filter(eligible) };
}

function pathChoices(s) {
  const { current, relocate, missing, reason, earned } = pathsFor(s);
  const cur = CITIES[current];
  const out = [{
    label: `Stay: become a manager at ${s.offer ? s.offer.company : cur.company} in ${cur.city}`, path: 'stay',
    say: 'I\'d like to stay and lead the team here.',
    effects: {},
    result: [{ speaker: 'ted', text: 'Great. Your network here stays with you — every relationship you built this year.', expression: 'happy' }],
  }];
  for (const k of relocate) {
    const c = CITIES[k];
    out.push({
      label: `Relocate: ${c.l3.role} at ${c.company} — ${c.city}`, path: k,
      say: `I've decided to take the manager role at ${c.company}.`,
      effects: {},
      result: [
        ...(earned.includes(k) ? [{ speaker: 'narrator', text: c.l3.referral }] : []),
        { speaker: 'narrator', text: `You accept. Your colleagues here become long-distance ties: trust −1 each, and favors cost a bit more — but they can still vouch for you from afar.` },
      ],
    });
  }
  if (missing) {
    const c = CITIES[missing];
    out.push({ label: `${c.company} — ${c.city}`, path: missing, notOffered: true, requires: { flag: '__never__' }, lockedHint: `Not offered: ${reason}`, effects: {} });
  }
  return out;
}

export function setLevel3Path(s, key) {
  const cur = (s.offer && s.offer.key) || DEFAULT_CITY;
  if (!s.offer) setOffer(s, cur);
  const stay = key === 'stay' || key === cur || !CITIES[key];
  s.flags = s.flags.filter((f) => f !== 'l3_stayed' && f !== 'l3_relocated');
  if (stay) {
    s.level3Path = { stayed: true, key: cur, city: CITIES[cur].city, company: s.offer.company };
    s.flags.push('l3_stayed');
    if (s.ldtApplied) { for (const id of L2_NETWORK) s.trust[id] = clamp((s.trust[id] || 0) + 1, 0, 5); s.ldtApplied = false; }
  } else {
    const c = CITIES[key];
    s.level3Path = { stayed: false, key, city: c.city, company: c.company };
    s.flags.push('l3_relocated');
    if (!s.ldtApplied) { for (const id of L2_NETWORK) s.trust[id] = clamp((s.trust[id] || 0) - 1, 0, 5); s.ldtApplied = true; }
  }
}

// Choices for a beat (the offer and path decisions build them from data/cities.js).
export function beatChoices(s, beat) {
  if (!beat) return [];
  if (beat.dynamic === 'offers') return offerChoices(s);
  if (beat.dynamic === 'paths') return pathChoices(s);
  return beat.choices;
}

export function setOffer(s, key) {
  const c = CITIES[key] || CITIES[DEFAULT_CITY];
  s.offer = { key: CITIES[key] ? key : DEFAULT_CITY, city: c.city, industry: c.industry, company: c.company };
}

/* ---------- Chapter scenes ---------- */

export function getChapter(s, level = s.level, week = s.week) {
  return (CHAPTERS[level] || {})[week] || null;
}

function containsInsert(lines, what) {
  for (const it of lines || []) {
    if (Array.isArray(it) ? containsInsert(it, what) : (it && (it.insert === what || (it.lines && containsInsert(it.lines, what))))) return true;
  }
  return false;
}

function beatDialog(s, chap, beat) {
  if (!chap) return newDialog([]);
  if (beat >= chap.beats.length) return newDialog(resolveLines(s, chap.outro));
  const b = chap.beats[beat];
  const pre = [];
  if (beat === 0) pre.push(...applyDelayed(s, chap));
  pre.push(...applyTriggers(s, chap, b));
  const lines = [...pre, ...resolveLines(s, b.lines)];
  // The uncertainty tied to your offer happens once, with a small effect.
  if (containsInsert(b.lines, 'uncertainty') && !s.flags.includes('l2_uncertainty')) {
    const city = offerCity(s) || CITIES[DEFAULT_CITY];
    const deltas = applyEffects(s, city.l2.uncertainty.effects);
    s.flags.push('l2_uncertainty');
    const parts = deltas.filter((d) => d.kind === 'meter').map((d) => `${d.value > 0 ? '+' : '−'}${Math.abs(d.value)} ${METER_NAMES[Object.keys(METER_KEYS).find((k) => METER_KEYS[k] === d.key)]}`);
    if (parts.length) lines.push({ speaker: 'narrator', text: `(${city.l2.uncertainty.note} ${parts.join(', ')}.)` });
    if (!Array.isArray(s.weekLedger)) s.weekLedger = [];
    s.weekLedger.push({ src: 'uncertainty', label: city.l2.uncertainty.note, title: chap.title, gains: meterGains(deltas) });
  }
  return newDialog(lines);
}

const effNote = (deltas) => deltas.filter((d) => d.kind === 'meter' || d.kind === 'res').map((d) => {
  const name = d.kind === 'res' ? RES_NAMES[d.res] : METER_NAMES[Object.keys(METER_KEYS).find((k) => METER_KEYS[k] === d.key)];
  return `${d.value > 0 ? '+' : '−'}${Math.abs(d.value)} ${name}`;
}).join(', ');

// Long-term effects from earlier choices that come due this chapter.
function applyDelayed(s, chap) {
  if (!Array.isArray(s.delayed) || !s.delayed.length) return [];
  const due = s.delayed.filter((d) => d.level === s.level && d.due <= s.week);
  if (!due.length) return [];
  s.delayed = s.delayed.filter((d) => !due.includes(d));
  const out = [];
  for (const d of due) {
    const deltas = applyEffects(s, d.effects);
    const n = effNote(deltas);
    out.push({ speaker: 'narrator', kind: 'later', text: `↩ Long-term effect: ${d.text}${n ? ` (${n})` : ''}` });
    if (!Array.isArray(s.weekLedger)) s.weekLedger = [];
    s.weekLedger.push({ src: 'later', label: 'Long-term effect of an earlier choice', title: chap.title, gains: meterGains(deltas) });
  }
  return out;
}

// Once-only story triggers on a beat: obstacles, ally help, the city twist.
function applyTriggers(s, chap, b) {
  const out = [];
  for (const tr of b.triggers || []) {
    const fid = `trig_${tr.id}`;
    if (s.flags.includes(fid) || (tr.if && !checkCond(s, tr.if))) continue;
    let lines; let eff; let note;
    if (tr.insert === 'l3Twist') {
      const tw = (l3City(s) || CITIES[DEFAULT_CITY]).l3.twist;
      lines = resolveLines(s, tw.lines); eff = tw.effects; note = tw.note;
    } else { lines = resolveLines(s, tr.lines); eff = tr.effects || {}; note = tr.note || ''; }
    s.flags.push(fid);
    const deltas = applyEffects(s, eff);
    const n = effNote(deltas);
    out.push(...lines);
    if (n) out.push({ speaker: 'narrator', text: `(${note} ${n}.)` });
    if (!Array.isArray(s.weekLedger)) s.weekLedger = [];
    s.weekLedger.push({ src: 'trigger', label: note, title: chap.title, gains: meterGains(deltas) });
  }
  return out;
}

export function enterScene(s, outcome) {
  s.gateOutcome = outcome;
  s.phase = 'scene';
  s.scene = { beat: 0, dialog: beatDialog(s, getChapter(s), 0), choice: null, result: null, review: false };
}

export function ensureSceneDialog(s) {
  if (s.phase !== 'scene' || !s.scene) return;
  if (!s.scene.dialog || !Array.isArray(s.scene.dialog.lines)) {
    s.scene.dialog = beatDialog(s, getChapter(s), s.scene.beat || 0);
    s.scene.dialog.shown = s.scene.dialog.lines.length;
  }
  if (s.scene.review === 'talk' && (!s.scene.reviewDialog || !Array.isArray(s.scene.reviewDialog.lines))) s.scene.review = 'summary';
  if (s.scene.review === true) s.scene.review = 'summary';
  if (s.scene.result && !Array.isArray(s.scene.result.lines)) {
    s.scene.result.lines = [{ speaker: 'narrator', text: s.scene.result.text || '' }];
    s.scene.result.shown = 1;
  }
}

export function chooseScene(s, idx) {
  const chap = getChapter(s);
  const beat = chap && chap.beats[s.scene.beat];
  if (!beat || s.scene.result || !dialogDone(s.scene.dialog)) return false;
  const choices = beatChoices(s, beat);
  const ch = choices[idx];
  if (!ch || !choiceState(s, ch, false).available) return false;
  const deltas = [];
  if (ch.momentum) { s.momentum -= ch.momentum; deltas.push({ kind: 'momentum', value: -ch.momentum }); }
  const lines = [seanLine(ch), ...resolveLines(s, ch.result)];
  record(s, 'scene', chap.title, choices, idx);
  deltas.push(...spendFavor(s, ch));
  deltas.push(...applyEffects(s, ch.effects));
  if (ch.offer) setOffer(s, ch.offer);
  if (ch.path) setLevel3Path(s, ch.path);
  s.weekLedger[s.weekLedger.length - 1].gains = meterGains(deltas);
  s.scene.choice = idx;
  s.scene.result = { lines, shown: 1, deltas };
  return true;
}

export function nextBeat(s) {
  const chap = getChapter(s);
  if (!chap) return false;
  const beat = chap.beats[s.scene.beat];
  if (beat && beatChoices(s, beat).length && !s.scene.result) return false;
  if (s.scene.beat >= chap.beats.length) return false;
  const b = s.scene.beat + 1;
  s.scene = { beat: b, dialog: beatDialog(s, chap, b), choice: null, result: null, review: false };
  return true;
}

export function openReview(s, lines) {
  const chap = getChapter(s);
  if (s.phase !== 'scene' || !chap || s.scene.beat < chap.beats.length) return false;
  if (lines && lines.length) { s.scene.review = 'talk'; s.scene.reviewDialog = newDialog(lines); }
  else s.scene.review = 'summary';
  return true;
}

export function openReviewSummary(s) {
  if (s.phase !== 'scene' || s.scene.review !== 'talk' || !dialogDone(s.scene.reviewDialog)) return false;
  s.scene.review = 'summary';
  return true;
}

export const charLabel = (id) => (CHARACTERS[id] ? CHARACTERS[id].display : id);
