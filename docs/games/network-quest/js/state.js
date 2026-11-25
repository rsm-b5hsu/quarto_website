// Game state + persistence (localStorage, schemaVersion 3; v1/v2 saves are migrated).
import { PLAYER_DEFAULT_NAME, START_TRUST, RENAMED_IDS } from '../data/characters.js';
import { DEFAULT_PERSONAL_GOAL } from '../data/missions.js';

export const SAVE_KEY = 'nq_save_v1';
export const SCHEMA_VERSION = 3;
export const DEFAULT_SEED = 459;

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    playerName: PLAYER_DEFAULT_NAME,

    level: 1, week: 1, day: 1, run: 1,
    phase: 'prologue',       // 'prologue' | 'day' | 'gate' | 'scene' | 'levelComplete'
    prologue: null,          // { level, dialog } — the level's opening story
    overtime: false,         // true while playing a bonus day at a closed gate

    energy: 3, carry: 0,
    momentum: 0,
    health: 70,              // 0–100; below 30 → next day starts with 1 less Energy
    lowHealthToday: false,
    skills: { communication: 0, persuasion: 0, teamwork: 0 },  // 0–3, raised by courses
    helped: [],              // NPCs you helped (favors from them cost 1 less trust)
    contacts: [],            // contacts met through activities
    seed: DEFAULT_SEED,      // seeded RNG → reproducible demo runs
    dayActs: [],             // today's 5 activities
    offer: null,             // { key, city, industry, company } chosen at the end of Level 1
    level3Path: null,        // { stayed, key, city, company } chosen at the end of Level 2
    ldtApplied: false,       // relocation trust penalty applied (long-distance ties)
    morale: 60,              // Team Morale 0–100 (Level 3)
    political: 30,           // Political Capital 0–100 (Level 3)
    delayed: [],             // long-term effects: [{ level, due (week), effects, text }]
    meters: { careerCapital: 20, networkStrength: 10, influence: 10 },
    trust: { ...START_TRUST },
    flags: [],

    usedEventIds: [],
    currentEventId: null,
    eventDialog: null,       // { lines, shown } — the current event's dialogue
    eventResult: null,       // { choice, lines, shown, deltas }
    dayLog: [],              // activities done today

    scene: { beat: 0, dialog: null, choice: null, result: null, review: false },
    weekLedger: [],          // this week's choices + meter gains (end-of-week review)

    counts: {},              // missionId -> actual this week
    logs: [],                // real-world action logs (metadata only)
    personalGoal: { ...DEFAULT_PERSONAL_GOAL },
    pendingPersonalGoal: null,
    goalPrompt: 1,           // level whose "set your personal goal" modal is pending (null = none)

    gateRule: 'systemBoth',
    forceGateFail: false,
    gracePassUsed: {},       // `${level}-${run}` -> true
    gateOutcome: null,       // 'passed' | 'manually_overridden'
    weekDemoAdjusted: false,

    history: [],
    unlockedLevels: [1],
    completedLevels: [],

    seenGlossary: [],
    introDone: false,
    demoMode: false,
    accountability: { partnerName: '', partnerEmail: '', consent: false, paused: false },
  };
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const inRange = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

// v1 → v2: add health, skills, favors, contacts, seed and the job offer.
const HELPED_FLAGS = { helped_emily: 'emily', gave_first: 'gian', l2_helped_ben: 'ben', l2_helped_shalini: 'shalini' };
function migrateV1(raw) {
  const s = { ...raw, schemaVersion: 2 };
  const flags = Array.isArray(raw.flags) ? raw.flags : [];
  s.helped = [...new Set(flags.map((f) => HELPED_FLAGS[f]).filter(Boolean))];
  if (raw.level >= 2 && !raw.offer) s.offer = { key: 'atlanta', city: 'Atlanta, GA', industry: 'Supply chain & logistics analytics', company: 'Northwind Analytics' };
  // Quick actions no longer exist; old day logs are dropped.
  s.dayLog = [];
  return s;
}

// Merge a parsed save onto defaults; returns null if it isn't a valid save.
export function normalize(raw) {
  if (!isObj(raw)) return null;
  if (raw.schemaVersion === 1) raw = migrateV1(raw);
  // v2 → v3: Level 3 fields get their defaults below.
  if (raw.schemaVersion === 2) raw = { ...raw, schemaVersion: 3 };
  if (raw.schemaVersion !== SCHEMA_VERSION) return null;
  const d = defaultState();
  const s = { ...d, ...raw };
  for (const k of ['meters', 'trust', 'accountability', 'scene', 'counts', 'gracePassUsed', 'personalGoal', 'skills']) {
    s[k] = { ...d[k], ...(isObj(raw[k]) ? raw[k] : {}) };
  }
  for (const k of ['flags', 'usedEventIds', 'logs', 'history', 'unlockedLevels', 'completedLevels', 'seenGlossary', 'dayLog', 'weekLedger', 'helped', 'contacts', 'dayActs', 'delayed']) {
    if (!Array.isArray(s[k])) s[k] = d[k];
  }
  // Saves from before per-level goals keep their goal and are not prompted retroactively.
  if (!('goalPrompt' in raw)) s.goalPrompt = null;
  if (s.goalPrompt != null && !inRange(s.goalPrompt, 1, 3)) s.goalPrompt = null;
  for (const k of ['personalGoal', 'pendingPersonalGoal']) {
    const g = s[k];
    if (g && !(typeof g.name === 'string' && g.name && Number.isInteger(g.target) && typeof g.unit === 'string' && g.unit)) s[k] = k === 'personalGoal' ? { ...d.personalGoal } : null;
  }
  migrateIds(s);
  if (!inRange(s.level, 1, 3) || !inRange(s.week, 1, 5) || !inRange(s.day, 1, 5)) return null;
  if (!['prologue', 'day', 'gate', 'scene', 'levelComplete'].includes(s.phase)) s.phase = 'day';
  if (!['systemBoth', 'all3', 'any2'].includes(s.gateRule)) s.gateRule = 'systemBoth';
  if (typeof s.playerName !== 'string' || !s.playerName.trim()) s.playerName = PLAYER_DEFAULT_NAME;
  s.momentum = Math.max(0, Math.min(5, Number(s.momentum) || 0));
  s.energy = Math.max(0, Math.min(4, Number(s.energy) || 0));
  s.health = Math.max(0, Math.min(100, Number.isFinite(s.health) ? s.health : 70));
  for (const k of Object.keys(d.skills)) s.skills[k] = Math.max(0, Math.min(3, Number(s.skills[k]) || 0));
  if (s.offer && !isObj(s.offer)) s.offer = null;
  if (s.level3Path && !isObj(s.level3Path)) s.level3Path = null;
  s.morale = Math.max(0, Math.min(100, Number.isFinite(s.morale) ? s.morale : 60));
  s.political = Math.max(0, Math.min(100, Number.isFinite(s.political) ? s.political : 30));
  if (!Number.isFinite(s.seed)) s.seed = DEFAULT_SEED;
  return s;
}

// Characters that were renamed keep their trust, flags, and events in older saves.
function migrateIds(s) {
  for (const [oldId, newId] of Object.entries(RENAMED_IDS)) {
    if (oldId in s.trust) {
      s.trust[newId] = Math.max(s.trust[newId] || 0, s.trust[oldId] || 0);
      delete s.trust[oldId];
    }
    const re = new RegExp(`(^|_)${oldId}(_|$)`, 'g');
    const fix = (v) => (typeof v === 'string' ? v.replace(re, `$1${newId}$2`) : v);
    s.flags = [...new Set(s.flags.map(fix))];
    s.usedEventIds = s.usedEventIds.map(fix);
    s.currentEventId = fix(s.currentEventId);
  }
}

export function load() {
  try {
    const txt = localStorage.getItem(SAVE_KEY);
    if (!txt) return defaultState();
    return normalize(JSON.parse(txt)) || defaultState();
  } catch (e) {
    console.warn('Could not load save; starting fresh.', e);
    return defaultState();
  }
}

export function save(s) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch (e) {
    console.warn('Could not save game.', e);
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}
