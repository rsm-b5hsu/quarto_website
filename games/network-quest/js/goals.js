// Missions, real-world action logs, the Reality Gate, week archive/reset,
// personal goal, demo helpers, and the accountability email preview.
import { LEVELS, PERSONAL_DEF } from '../data/missions.js';
import { CAST, START_TRUST, CONTACTS } from '../data/characters.js';
import { startDay, startPrologue, getChapter, enterScene, setOffer, setLevel3Path, MAX_MOMENTUM, WEEKS_PER_LEVEL } from './engine.js';

export const GATE_RULES = {
  systemBoth: 'Both system missions met (personal goal optional)',
  all3: 'All three missions met',
  any2: 'Any two of the three missions met',
};

export const STATUS_LABELS = {
  uploaded_unverified: 'Uploaded · unverified',
  self_reported: 'Self-reported',
  manually_overridden: 'Manually overridden',
  AI_approved: 'AI approved',
  AI_rejected: 'AI rejected',
};

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export const weekKey = (s) => `L${s.level}-W${s.week}-R${s.run}`;
export const graceKey = (s) => `${s.level}-${s.run}`;

export function getMissions(s) {
  const L = LEVELS[s.level];
  const sys = L.missions.map((m) => ({
    ...m,
    source: 'system',
    target: m.targets[s.week - 1],
    task: m.tasks[s.week - 1],
    actual: s.counts[m.id] || 0,
  }));
  const p = {
    ...PERSONAL_DEF,
    source: 'player',
    name: s.personalGoal.name,
    unit: s.personalGoal.unit,
    target: s.personalGoal.target,
    task: `${s.personalGoal.target} ${s.personalGoal.unit} this week`,
    actual: s.counts.personal || 0,
  };
  return [...sys, p];
}

export function gateStatus(s) {
  const missions = getMissions(s).map((m) => ({
    ...m,
    met: m.actual >= m.target,
    short: Math.max(0, m.target - m.actual),
    required: s.gateRule === 'all3' || (s.gateRule === 'systemBoth' && m.source === 'system'),
  }));
  const metCount = missions.filter((m) => m.met).length;
  let met;
  if (s.gateRule === 'all3') met = metCount === 3;
  else if (s.gateRule === 'any2') met = metCount >= 2;
  else met = missions.filter((m) => m.source === 'system').every((m) => m.met);
  const forced = !!s.forceGateFail;
  return {
    met: met && !forced,
    rulesMet: met,
    forced,
    missions,
    metCount,
    rule: s.gateRule,
    graceAvailable: !s.gracePassUsed[graceKey(s)],
  };
}

export function weekLogs(s) {
  const k = weekKey(s);
  return s.logs.filter((l) => l.weekKey === k);
}

/* ---------- Logging real actions ---------- */

// One log = one mission (prevents double credit). Every log grants +1 Momentum.
export function addLog(s, { missionId, count, evidenceType, screenshot, reflection, demo }) {
  const m = getMissions(s).find((x) => x.id === missionId);
  if (!m) throw new Error('Unknown mission');
  if (!['screenshot', 'reflection', 'self_report'].includes(evidenceType)) throw new Error('Unknown evidence type');
  const n = missionId === 'personal' ? Math.max(1, Math.min(10000, parseInt(count, 10) || 1)) : 1;
  const log = {
    id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    weekKey: weekKey(s), level: s.level, week: s.week,
    missionId, missionName: missionId === 'personal' ? s.personalGoal.name : m.name,
    count: n,
    evidenceType,
    status: evidenceType === 'screenshot' ? 'uploaded_unverified' : 'self_reported',
    screenshot: screenshot ? { name: String(screenshot.name).slice(0, 120), size: screenshot.size, type: screenshot.type } : null,
    reflection: reflection || null,
    demo: !!demo,
    createdAt: new Date().toISOString(),
  };
  s.logs.push(log);
  s.counts[missionId] = (s.counts[missionId] || 0) + n;
  const before = s.momentum;
  s.momentum = Math.min(MAX_MOMENTUM, s.momentum + 1);
  return { log, momentumGained: s.momentum - before };
}

/* ---------- Gate → scene → archive ---------- */

export function passGate(s) {
  if (!gateStatus(s).met) return false;
  enterScene(s, 'passed');
  return true;
}

export function useGracePass(s) {
  const g = gateStatus(s);
  if (g.met || !g.graceAvailable) return false;
  s.gracePassUsed[graceKey(s)] = true;
  enterScene(s, 'manually_overridden');
  return true;
}

export function completeWeek(s) {
  const g = gateStatus(s);
  const logs = weekLogs(s);
  const byStatus = {};
  for (const l of logs) byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  const chap = getChapter(s);
  s.history.push({
    weekKey: weekKey(s), level: s.level, week: s.week, run: s.run,
    chapter: chap ? chap.title : '',
    completedAt: new Date().toISOString(),
    gateRule: s.gateRule,
    gateOutcome: s.gateOutcome || 'passed',
    missions: g.missions.map((m) => ({ id: m.id, name: m.source === 'player' ? m.name : m.name, actual: m.actual, target: m.target, unit: m.unit, met: m.met })),
    evidence: byStatus,
    demoSampleLogs: logs.filter((l) => l.demo).length,
    demoAdjusted: !!s.weekDemoAdjusted,
    meterGains: weekGains(s),
  });

  s.counts = {};
  s.weekDemoAdjusted = false;
  s.gateOutcome = null;
  s.weekLedger = [];
  s.usedEventIds = [];
  s.overtime = false;
  if (s.pendingPersonalGoal) {
    s.personalGoal = s.pendingPersonalGoal;
    s.pendingPersonalGoal = null;
  }

  if (s.week >= WEEKS_PER_LEVEL) {
    s.phase = 'levelComplete';
    if (!s.completedLevels.includes(s.level)) s.completedLevels.push(s.level);
    const next = LEVELS[s.level + 1];
    if (next && !next.futureScope && !s.unlockedLevels.includes(s.level + 1)) s.unlockedLevels.push(s.level + 1);
  } else {
    s.week += 1;
    s.day = 1;
    s.phase = 'day';
    startDay(s);
  }
}

// Sum of meter changes this week (from the ledger).
export function weekGains(s) {
  const g = { cc: 0, ns: 0, inf: 0 };
  for (const e of s.weekLedger || []) for (const [k, v] of Object.entries(e.gains || {})) g[k] = (g[k] || 0) + v;
  return g;
}

// Start (or repeat) a level. History is always preserved.
export function startLevel(s, lvl) {
  const L = LEVELS[lvl];
  if (!L || L.futureScope) return false;
  const repeat = s.completedLevels.includes(lvl) || s.level === lvl;
  if (repeat) {
    for (const id of CAST[lvl] || []) s.trust[id] = START_TRUST[id];
    for (const id of CONTACTS[lvl] || []) { delete s.trust[id]; }
    s.contacts = s.contacts.filter((id) => !(CONTACTS[lvl] || []).includes(id));
    const keepPath = (f) => f === 'l3_stayed' || f === 'l3_relocated';
    if (lvl === 1) s.flags = s.flags.filter((f) => f.startsWith('l2_') || f.startsWith('l3_'));
    else s.flags = s.flags.filter((f) => !f.startsWith(`l${lvl}_`) && !f.startsWith('trig_l3') || keepPath(f));
    if (lvl === 3) s.delayed = [];
  }
  if (lvl >= 2 && !s.offer) setOffer(s, 'atlanta');
  if (lvl === 3) {
    if (!s.level3Path) setLevel3Path(s, 'stay');
    s.morale = 60;
    s.political = 30 + (s.level3Path.stayed && (s.trust.ted || 0) >= 3 ? 10 : 0);
    s.delayed = [];
    for (const id of CAST[3]) if (s.trust[id] == null) s.trust[id] = START_TRUST[id];
  }
  if (!s.unlockedLevels.includes(lvl)) s.unlockedLevels.push(lvl);
  s.level = lvl; s.week = 1; s.day = 1; s.run = (s.run || 1) + 1;
  s.counts = {}; s.usedEventIds = []; s.overtime = false; s.weekLedger = [];
  s.gateOutcome = null; s.weekDemoAdjusted = false;
  s.goalPrompt = lvl;
  startPrologue(s);
  return true;
}

/* ---------- Personal goal ---------- */

export function validateGoal({ name, target, unit }) {
  const g = {
    name: String(name || '').trim().slice(0, 60),
    target: parseInt(target, 10),
    unit: String(unit || '').trim().slice(0, 30),
  };
  if (!g.name) return { error: 'Give the goal a name.' };
  if (!Number.isInteger(g.target) || g.target < 1 || g.target > 10000) return { error: 'Target must be a whole number from 1 to 10,000.' };
  if (!g.unit) return { error: 'Give a unit (e.g. workouts, hours, applications).' };
  return { goal: g };
}

export function setPersonalGoal(s, goal, applyNow) {
  if (applyNow) { s.personalGoal = goal; s.pendingPersonalGoal = null; }
  else s.pendingPersonalGoal = goal;
}

// Level-start goal modal: the new goal applies right away (Week 1 is starting).
export function applyLevelGoal(s, goal) {
  s.personalGoal = { ...goal };
  s.pendingPersonalGoal = null;
  s.goalPrompt = null;
}
export function keepLevelGoal(s) { s.goalPrompt = null; }
export const suggestedGoal = (lvl) => ({ ...LEVELS[lvl].suggestedPersonalGoal });

/* ---------- Demo helpers (all clearly labeled) ---------- */

export function demoJump(s, level, week, day, toGate) {
  if (!LEVELS[level] || LEVELS[level].futureScope) return;
  if (!s.unlockedLevels.includes(level)) s.unlockedLevels.push(level);
  s.level = level; s.week = week; s.day = day;
  s.counts = {}; s.usedEventIds = []; s.overtime = false; s.gateOutcome = null;
  s.weekLedger = [];
  s.weekDemoAdjusted = true;
  s.prologue = null;
  if (level >= 2 && !s.offer) setOffer(s, 'atlanta');
  if (level >= 3 && !s.level3Path) setLevel3Path(s, 'stay');
  if (toGate) { s.day = 5; s.phase = 'gate'; s.currentEventId = null; s.eventResult = null; }
  else { s.phase = 'day'; startDay(s); }
}

export function demoSetCounts(s, counts) {
  for (const [k, v] of Object.entries(counts)) s.counts[k] = Math.max(0, parseInt(v, 10) || 0);
  s.weekDemoAdjusted = true;
}

export function fillSampleEvidence(s) {
  const ms = getMissions(s);
  let added = 0;
  for (const m of ms) {
    let need = Math.max(0, m.target - (s.counts[m.id] || 0));
    if (m.id === 'personal') {
      if (need > 0) {
        addLog(s, { missionId: m.id, count: need, evidenceType: 'screenshot', demo: true,
          screenshot: { name: `DEMO_SAMPLE_${(s.personalGoal.unit || 'goal').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_tracker.png`, size: 0, type: 'image/png' } });
        added++;
      }
      continue;
    }
    let i = 0;
    while (need > 0) {
      const asReflection = i % 2 === 1;
      addLog(s, {
        missionId: m.id, count: 1, demo: true,
        evidenceType: asReflection ? 'reflection' : 'screenshot',
        screenshot: asReflection ? null : { name: `DEMO_SAMPLE_${m.id}_${i + 1}.png`, size: 0, type: 'image/png' },
        reflection: asReflection ? { who: 'DEMO SAMPLE — alumna, product analytics', what: 'DEMO SAMPLE — discussed career paths', next: 'DEMO SAMPLE — send follow-up' } : null,
      });
      need--; i++; added++;
    }
  }
  s.weekDemoAdjusted = true;
  return added;
}

// Demo: pick a job offer and start Level 2 with it.
export function demoChooseOffer(s, key) {
  setOffer(s, key);
  if (!s.flags.includes(`offer_${key}`)) s.flags = s.flags.filter((f) => !f.startsWith('offer_')).concat(`offer_${key}`);
  if (!s.unlockedLevels.includes(2)) s.unlockedLevels.push(2);
  s.weekDemoAdjusted = true;
  return startLevel(s, 2);
}

// Demo: choose the Level 3 path (stay, or relocate to a city) and start Level 3 at its prologue.
export function demoChooseLevel3Path(s, choice) {
  if (!s.offer) setOffer(s, 'atlanta');
  setLevel3Path(s, choice);
  for (const L of [2, 3]) if (!s.unlockedLevels.includes(L)) s.unlockedLevels.push(L);
  const r = startLevel(s, 3);
  s.weekDemoAdjusted = true;
  return r;
}

export const STORY_PRESETS = {
  networker: {
    label: 'Networker path (high trust, many favors)',
    skills: { communication: 2, persuasion: 2, teamwork: 2 },
    helped: ['emily', 'gian', 'ben', 'shalini'],
    trust: { gian: 4, mercer: 3, emily: 4, molly: 3, ted: 3, ben: 3, jihee: 3, shalini: 3, teresa: 3, naveen: 3, ashley: 3, ray: 2 },
    res: { morale: 70, political: 55 },
    flags: ['went_panel', 'met_gian', 'met_molly', 'followed_up_gian', 'helped_emily', 'asked_gian', 'gave_first', 'commented_molly', 'office_hours', 'case_team', 'applied_northwind',
      'l2_asked_users', 'l2_ben_definitions', 'l2_helped_shalini', 'l2_shared_draft'],
    meters: { careerCapital: 40, networkStrength: 60, influence: 45 },
  },
  solo: {
    label: 'Solo-grinder path (high skill, few allies)',
    skills: { communication: 0, persuasion: 0, teamwork: 0 },
    helped: [],
    trust: { gian: 0, mercer: 1, emily: 1, molly: 0, ted: 2, ben: 0, jihee: 0, shalini: 0, teresa: 1, naveen: 1, ashley: 0, ray: 0 },
    res: { morale: 45, political: 25 },
    flags: ['declined_emily', 'applied_northwind'],
    meters: { careerCapital: 70, networkStrength: 12, influence: 15 },
  },
};

export function applyStoryPreset(s, key) {
  const p = STORY_PRESETS[key];
  if (!p) return;
  s.trust = { ...s.trust, ...p.trust };
  s.flags = [...p.flags];
  s.meters = { ...p.meters };
  s.skills = { ...p.skills };
  s.morale = p.res.morale; s.political = p.res.political;
  // Keep the chosen paths when a preset is applied mid-game.
  for (const f of ['l3_stayed', 'l3_relocated']) if (s.level3Path && (f === 'l3_stayed') === s.level3Path.stayed && !s.flags.includes(f)) s.flags.push(f);
  s.helped = [...p.helped];
}

/* ---------- Accountability preview (never sent) ---------- */

export function accountabilityEmail(s) {
  const ms = getMissions(s);
  const name = s.playerName;
  const parts = ms.map((m) => (m.source === 'system'
    ? `${m.actual}/${m.target} ${m.summaryUnit}`
    : `${m.actual}/${m.target} ${m.unit} (personal goal: ${m.name})`));
  const logs = weekLogs(s);
  const unverified = logs.filter((l) => l.status === 'uploaded_unverified').length;
  const selfRep = logs.filter((l) => l.status === 'self_reported').length;
  const demoN = logs.filter((l) => l.demo).length;
  const g = gateStatus(s);
  const L = LEVELS[s.level];
  const a = s.accountability;
  const to = a.partnerName || a.partnerEmail
    ? `${a.partnerName || '(no name)'}${a.partnerEmail ? ` <${a.partnerEmail}>` : ''}`
    : '(no partner set)';
  const lines = [
    `To: ${to}`,
    `Subject: Network Quest weekly summary — ${name}`,
    '',
    `Hi${a.partnerName ? ' ' + a.partnerName : ''},`,
    '',
    `${name} completed ${parts[0]}, ${parts[1]}, and ${parts[2]} this week.`,
    '',
    `Evidence: ${unverified} uploaded (unverified), ${selfRep} self-reported.${demoN ? ` ${demoN} of these are DEMO SAMPLE entries, not real actions.` : ''}`,
    `Story progress (fictional): Level ${s.level} · ${L.title}, Week ${s.week}. Chapter gate: ${g.met ? 'open' : s.phase === 'scene' || s.phase === 'levelComplete' ? 'passed' : 'not yet open'}.`,
    '',
    'Screenshots and reports are not verified and do not prove a message was delivered.',
    `You're receiving this because ${name} asked you to be their accountability partner and you agreed.`,
  ];
  return { text: lines.join('\n'), consent: !!a.consent, paused: !!a.paused, hasPartner: !!(a.partnerName || a.partnerEmail) };
}
