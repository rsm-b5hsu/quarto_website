// Boot + event wiring. All state mutations go through commit() → save + render.
import * as St from './state.js';
import * as E from './engine.js';
import * as G from './goals.js';
import * as UI from './ui.js';
import * as R from './review.js';
import { LEVELS, PERSONAL_GOAL_PICKS } from '../data/missions.js';

let S = St.load();
let shotFile = null;      // currently selected screenshot (never persisted)
let shotURL = null;       // object URL for the preview (revoked on close)

function ensureDay() {
  E.ensurePrologue(S);
  if (S.phase === 'day' && !E.getEvent(S)) E.startDay(S);
  E.ensureEventDialog(S);
  E.ensureSceneDialog(S);
}

function render() {
  UI.renderAll(S);
  if (UI.flushTerms(S)) St.save(S);
}

function commit({ focus = false } = {}) {
  St.save(S);
  render();
  if (focus) UI.focusStage();
}

/* ---------- Intro ---------- */

function showIntro(step = 0) {
  const it = UI.introHTML(S, step);
  UI.openModal(it.title, it.body, { keepFocus: true, onClose: finishIntro });
}

function finishIntro() {
  if (!S.introDone) { S.introDone = true; commit(); }
  else render();
  maybeGoalPrompt();
}

/* ---------- Level-start personal goal ---------- */

// Opens "Set this level's personal goal" when a level has just started (after the intro).
function maybeGoalPrompt() {
  if (!S.goalPrompt || !S.introDone || UI.isModalOpen()) return;
  const lvl = S.goalPrompt;
  UI.openModal('Set this level\'s personal goal', UI.levelGoalHTML(S, lvl), {
    onClose: () => { if (S.goalPrompt) { G.keepLevelGoal(S); St.save(S); } render(); },
  });
}

function goalDone(msg) {
  UI.closeModal();
  commit();
  UI.toast(msg);
}

function submitLevelGoal(form) {
  const res = G.validateGoal({ name: form.name.value, target: form.target.value, unit: form.unit.value });
  if (res.error) { UI.$('#level-goal-error').textContent = res.error; return; }
  G.applyLevelGoal(S, res.goal);
  goalDone(`Personal goal: ${res.goal.name} — ${res.goal.target} ${res.goal.unit} per week.`);
}

/* ---------- Modals ---------- */

function revokeShot() {
  if (shotURL) URL.revokeObjectURL(shotURL);
  shotURL = null; shotFile = null;
}

function openLog(preselect) {
  revokeShot();
  UI.openModal('Log a real-world action', UI.logModalHTML(S, preselect), { onClose: () => { revokeShot(); render(); } });
  UI.syncLogForm(S);
}

function openDemo() {
  UI.openModal('Demo Mode', UI.demoHTML(S), { wide: true, keepFocus: true, onClose: render });
}

function openSettings() {
  UI.openModal('Settings', UI.settingsHTML(S), { wide: true, onClose: render });
}

function handleShotFile(input) {
  const err = UI.$('#shot-error');
  const prev = UI.$('#shot-preview');
  revokeShot();
  err.textContent = '';
  prev.innerHTML = '';
  const f = input.files && input.files[0];
  if (!f) return;
  if (!f.type || !f.type.startsWith('image/')) {
    err.textContent = 'That file isn’t an image. Please choose a PNG, JPG, GIF, or WebP screenshot.';
    input.value = '';
    return;
  }
  if (f.size > G.MAX_SCREENSHOT_BYTES) {
    err.textContent = `That image is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`;
    input.value = '';
    return;
  }
  shotFile = f;
  shotURL = URL.createObjectURL(f);
  prev.innerHTML = `<img src="${shotURL}" alt="Preview of your selected screenshot"><span class="muted small">${UI.esc(f.name)} · ${(f.size / 1024).toFixed(0)} KB · preview only, not saved</span>`;
}

function submitLog(form) {
  const errEl = UI.$('#log-error');
  errEl.textContent = '';
  const missionId = form.mission.value;
  const ev = form.querySelector('input[name="ev"]:checked').value;
  const payload = { missionId, count: form.count.value, evidenceType: ev };
  if (ev === 'screenshot') {
    if (!shotFile) { errEl.textContent = 'Choose a screenshot, or switch to a reflection or self-report.'; return; }
    payload.screenshot = { name: shotFile.name, size: shotFile.size, type: shotFile.type };
  } else if (ev === 'reflection') {
    const r = { who: form.who.value.trim(), what: form.what.value.trim(), next: form.next.value.trim() };
    if (!r.who || !r.what) { errEl.textContent = 'Fill in at least “who” (role only) and “what was exchanged”.'; return; }
    payload.reflection = r;
  }
  const wasMet = G.gateStatus(S).met;
  const { log, momentumGained } = G.addLog(S, payload);
  UI.closeModal();
  commit();
  const nowMet = G.gateStatus(S).met;
  let msg = `Logged +${log.count} · ${G.STATUS_LABELS[log.status]}${momentumGained ? ' · +1 ⚡ Momentum' : ' · Momentum full'}`;
  if (!wasMet && nowMet) msg += ' · Reality Gate open!';
  UI.toast(msg);
}

function submitGoal(form) {
  const res = G.validateGoal({ name: form.name.value, target: form.target.value, unit: form.unit.value });
  if (res.error) { UI.$('#goal-error').textContent = res.error; return; }
  const now = form.applyNow.checked;
  G.setPersonalGoal(S, res.goal, now);
  UI.closeModal();
  commit();
  UI.toast(now ? 'Personal goal updated for this week.' : 'Personal goal saved — takes effect next week.');
}

function submitSettings(form, silent = false) {
  const name = form.playerName.value.trim();
  const email = form.partnerEmail.value.trim();
  const err = UI.$('#settings-error');
  if (!name) { err.textContent = 'Your name can’t be empty.'; return false; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'That email address doesn’t look right.'; return false; }
  S.playerName = name.slice(0, 30);
  S.accountability = {
    partnerName: form.partnerName.value.trim().slice(0, 40),
    partnerEmail: email.slice(0, 80),
    consent: form.consent.checked,
    paused: form.paused.checked,
  };
  St.save(S);
  if (!silent) { UI.toast('Settings saved.'); UI.closeModal(); }
  return true;
}

function copyEmail() {
  const text = UI.$('#email-text').textContent;
  const done = () => UI.toast('Copied. (Still nothing was sent.)');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { UI.toast('Copy failed — select the text manually.'); }
  ta.remove();
}

function exportSave() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `network-quest-save-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importSave(file) {
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { UI.toast('That file is too large to be a save.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const next = St.normalize(JSON.parse(reader.result));
      if (!next) throw new Error('invalid');
      S = next; ensureDay();
      UI.closeModal(); commit();
      UI.toast('Save imported.');
    } catch (e) {
      UI.toast('Not a valid Network Quest save.');
    }
  };
  reader.readAsText(file);
}

function resetSave() {
  if (!window.confirm('Reset all progress, logs, and history in this browser? This cannot be undone.')) return;
  St.clearSave();
  S = St.defaultState();
  ensureDay();
  UI.closeModal();
  UI.hideTermCard();
  commit();
  showIntro(0);
}

/* ---------- Click actions ---------- */

const actions = {
  'modal-close': () => UI.closeModal(),

  choose: (el) => { if (E.chooseEvent(S, +el.dataset.idx)) commit({ focus: true }); },
  activity: (el) => {
    const r = E.doActivity(S, el.dataset.id);
    if (r) { commit(); const b = UI.$(`#stage [data-action="activity"][data-id="${el.dataset.id}"]`); if (b) b.focus(); }
  },
  'prologue-done': () => { if (E.finishPrologue(S)) { commit({ focus: true }); window.scrollTo({ top: 0 }); } },
  'demo-prologue': () => { E.startPrologue(S); S.weekDemoAdjusted = true; UI.closeModal(); commit({ focus: true }); },
  'end-day': () => { if (E.endDay(S)) commit({ focus: true }); },
  'bonus-day': () => { if (E.playBonusDay(S)) { commit({ focus: true }); UI.toast('Bonus day: events stay playable while the gate is closed.'); } },
  'gate-enter': () => { if (G.passGate(S)) commit({ focus: true }); },
  grace: () => {
    if (!window.confirm('Use your one Grace Pass for this level? The week will be recorded as “manually overridden” — your real counts stay as they are.')) return;
    if (G.useGracePass(S)) commit({ focus: true });
  },
  'scene-choose': (el) => { if (E.chooseScene(S, +el.dataset.idx)) commit({ focus: true }); },
  'scene-next': () => { if (E.nextBeat(S)) commit({ focus: true }); },
  'line-next': () => { if (E.advanceLine(S)) commit({ focus: true }); },
  'line-skip': () => { if (E.revealAll(S)) commit({ focus: true }); },
  'review-open': () => { if (E.openReview(S, R.reviewTalkLines(S))) commit({ focus: true }); },
  'review-summary': () => { if (E.openReviewSummary(S)) { commit(); window.scrollTo({ top: 0 }); UI.focusStage(); } },
  'scene-finish': () => {
    const lvl = S.level, wk = S.week;
    G.completeWeek(S);
    commit({ focus: true });
    UI.toast(S.phase === 'levelComplete' ? `Level ${lvl} complete! History saved.` : `Week ${wk} archived. Week ${S.week} begins — counts reset.`);
  },
  'level-start': (el) => {
    const lvl = +el.dataset.level;
    const mid = S.phase !== 'levelComplete' && (S.week > 1 || S.day > 1);
    if (mid && !window.confirm(`Start Level ${lvl} from Week 1? Your current week's counts reset; history is kept.`)) return;
    if (G.startLevel(S, lvl)) { UI.closeModal(); commit({ focus: true }); UI.toast(`Level ${lvl}: ${LEVELS[lvl].title}`); maybeGoalPrompt(); }
  },

  'log-open': (el) => openLog(el.dataset.mission),
  'mission-info': (el) => {
    const m = G.getMissions(S).find((x) => x.id === el.dataset.id);
    if (m) UI.openModal(`ⓘ ${UI.esc(m.tag)}${m.source === 'player' ? ' goal' : ''}`, UI.missionInfoHTML(m), { onClose: render });
  },
  'goal-keep': () => { G.keepLevelGoal(S); goalDone(`Keeping your goal: ${S.personalGoal.name}.`); },
  'goal-suggested': () => {
    const g = G.suggestedGoal(S.goalPrompt || S.level);
    G.applyLevelGoal(S, g);
    goalDone(`Personal goal: ${g.name} — ${g.target} ${g.unit} per week.`);
  },
  'goal-pick': (el) => {
    const g = PERSONAL_GOAL_PICKS[+el.dataset.idx];
    const f = el.closest('form');
    if (!g || !f) return;
    f.name.value = g.name; f.target.value = g.target; f.unit.value = g.unit;
    f.querySelectorAll('.chip-btn').forEach((b) => b.classList.toggle('on', b === el));
  },
  'goal-edit': () => UI.openModal('Edit personal goal', UI.goalEditHTML(S), { onClose: render }),
  'help-open': () => { UI.hideTermCard(); UI.openModal('Help & Glossary', UI.helpHTML(), { wide: true, keepFocus: true, onClose: render }); },
  'settings-open': openSettings,
  'levels-open': () => UI.openModal('Levels', UI.levelsHTML(S), { onClose: render }),
  'email-preview': () => {
    const sf = UI.$('#settings-form');
    if (sf && !submitSettings(sf, true)) return;
    UI.openModal('Weekly accountability email', UI.emailHTML(S), { wide: true, keepFocus: true, onClose: render });
  },
  'copy-email': copyEmail,
  'real-sim': () => UI.openModal('What’s real vs. simulated', UI.realSimHTML(), { wide: true, keepFocus: true, onClose: render }),
  'export-save': exportSave,
  'reset-save': resetSave,

  'term-show': (el) => UI.showTermCard(el.dataset.term, false),
  'term-dismiss': () => { UI.hideTermCard(); render(); },

  'intro-next': (el) => {
    const step = +el.dataset.step;
    if (step >= UI.INTRO_STEPS - 1) UI.closeModal();
    else showIntro(step + 1);
  },
  'intro-back': () => {
    const cur = +UI.$('[data-action="intro-next"]').dataset.step;
    showIntro(Math.max(0, cur - 1));
  },
  'intro-skip': () => UI.closeModal(),
  'intro-replay': () => showIntro(0),

  'demo-open': () => {
    if (!S.demoMode) { S.demoMode = true; commit(); UI.toast('Demo Mode on — simulated data only.'); }
    openDemo();
  },
  'demo-off': () => { S.demoMode = false; S.forceGateFail = false; UI.closeModal(); commit(); UI.toast('Demo Mode off.'); },
  'demo-jump': () => demoJump(false),
  'demo-jump-gate': () => demoJump(true),
  'demo-set-counts': () => {
    const counts = {};
    document.querySelectorAll('[data-count]').forEach((i) => { counts[i.dataset.count] = i.value; });
    G.demoSetCounts(S, counts); St.save(S); render(); openDemo(); UI.toast('Counts set (marked as demo-adjusted).');
  },
  'demo-fill': () => {
    const n = G.fillSampleEvidence(S); St.save(S); render(); openDemo();
    UI.toast(n ? `Added ${n} DEMO SAMPLE log(s).` : 'All targets already met.');
  },
  'demo-momentum': () => {
    S.momentum = Math.min(E.MAX_MOMENTUM, S.momentum + 1); S.weekDemoAdjusted = true;
    St.save(S); render(); openDemo(); UI.toast('+1 ⚡ (demo only)');
  },
  'demo-preset': () => {
    const key = UI.$('#d-preset').value;
    if (!key) return;
    G.applyStoryPreset(S, key); St.save(S); render(); openDemo(); UI.toast('Story preset applied.');
  },
  'demo-unlock': () => {
    if (!S.unlockedLevels.includes(2)) S.unlockedLevels.push(2);
    St.save(S); render(); openDemo(); UI.toast('Level 2 unlocked (demo).');
  },
  'demo-offer': () => {
    const key = UI.$('#d-offer').value;
    G.demoChooseOffer(S, key);
    UI.closeModal(); commit({ focus: true });
    UI.toast(`Demo: started Level 2 at ${S.offer.company} (${S.offer.city}).`);
  },
  'demo-l3path': () => {
    G.demoChooseLevel3Path(S, UI.$('#d-l3path').value);
    UI.closeModal(); commit({ focus: true });
    UI.toast(`Demo: Level 3 — ${S.level3Path.stayed ? 'stayed' : 'relocated'} (${S.level3Path.company}, ${S.level3Path.city}).`);
    maybeGoalPrompt();
  },
  'demo-seed': () => {
    const v = Math.max(0, Math.min(999999, Math.floor(+UI.$('#d-seed').value || 0)));
    S.seed = v; S.weekDemoAdjusted = true;
    if (S.phase === 'day' && !S.eventResult) E.startDay(S); else S.dayActs = E.drawActivities(S);
    St.save(S); render(); openDemo(); UI.toast(`Seed set to ${v}.`);
  },
  'demo-skills': () => {
    for (const k of Object.keys(S.skills)) S.skills[k] = Math.max(S.skills[k], 2);
    S.weekDemoAdjusted = true; St.save(S); render(); openDemo(); UI.toast('Skills set to 2 (demo only).');
  },
  'demo-health': () => {
    S.health = 20; S.weekDemoAdjusted = true; St.save(S); render(); openDemo(); UI.toast('Health set to 20 (demo only).');
  },
};

function demoJump(toGate) {
  const lvl = +UI.$('#d-level').value, wk = +UI.$('#d-week').value, day = +UI.$('#d-day').value;
  G.demoJump(S, lvl, wk, day, toGate);
  UI.closeModal();
  commit({ focus: true });
  UI.toast(toGate ? `Jumped to L${lvl} W${wk} Reality Gate.` : `Jumped to L${lvl} W${wk} Day ${day}.`);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.closest('#log-form')) {
    if (t.id === 'log-file') handleShotFile(t);
    else UI.syncLogForm(S);
  } else if (t.id === 'd-rule') {
    S.gateRule = t.value; St.save(S); render(); UI.toast('Gate rule changed.');
  } else if (t.id === 'd-force') {
    S.forceGateFail = t.checked; St.save(S); render(); UI.toast(t.checked ? 'Gate will be forced to fail.' : 'Gate back to normal.');
  } else if (t.id === 'import-file') {
    importSave(t.files[0]);
  }
});

document.addEventListener('submit', (e) => {
  const f = e.target;
  e.preventDefault();
  if (f.id === 'log-form') submitLog(f);
  else if (f.id === 'goal-form') submitGoal(f);
  else if (f.id === 'level-goal-form') submitLevelGoal(f);
  else if (f.id === 'settings-form') submitSettings(f);
});

document.addEventListener('keydown', (e) => {
  // Space / Enter advance dialogue when focus isn't on a control.
  if ((e.key === ' ' || e.key === 'Enter') && !UI.isModalOpen() && !e.altKey && !e.ctrlKey && !e.metaKey) {
    const a = document.activeElement;
    const onControl = a && a !== document.body && a.matches('button, a, input, select, textarea, summary, [tabindex]');
    if (!onControl && E.advanceLine(S)) { e.preventDefault(); commit({ focus: true }); return; }
  }
  if (e.key === 'Escape') {
    if (UI.isModalOpen()) UI.closeModal();
    else UI.hideTermCard();
  }
  // Keep Tab focus inside an open modal.
  if (e.key === 'Tab' && UI.isModalOpen()) {
    const m = UI.$('#modal-root .modal');
    const items = [...m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((x) => !x.disabled && x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Boot ---------- */

ensureDay();
St.save(S);
render();
if (!S.introDone) showIntro(0);
else maybeGoalPrompt();
