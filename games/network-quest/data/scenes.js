// Static story content. No runtime generation.
//   data/events.js   — daily events (themed per week)
//   data/chapters.js — weekly chapter scenes
//   data/lines.js    — helpers for writing dialogue lines
//
// Condition: { flag }, { notFlag }, { not: cond }, { trustGte: [id, n] },
//            { meterGte: [cc|ns|inf, n] }, { alliesGte: n }, { all: [...] }, { any: [...] }
// Tokens:    {c:id} character, {C:id} full name, {p} player name, {co} company (Level 2+: your offer),
//            {oc} offer company, {city} offer city,
//            {allies} ally count, {t:glossaryId|shown text} glossary term
// Level 2 flags are prefixed "l2_" so a replay of a level can reset its own flags.
export { EVENTS } from './events.js';
export { CHAPTERS } from './chapters.js';

// Plain-language reasons shown as "↩ Remembered: …" when an earlier choice
// changes a scene or unlocks an option (delayed consequences made visible).
export const FLAG_NOTES = {
  went_panel: 'you went to the alumni panel',
  helped_emily: 'you helped {c:emily} with her resume',
  declined_emily: 'you were too busy to help {c:emily}',
  commented_molly: "you left a thoughtful comment on {c:molly}'s post",
  applied_northwind: 'you applied to {co}',
  tailored_northwind: 'you tailored your resume for {co}',
  office_hours: "you went to {c:mercer}'s office hours",
  case_team: "you joined {c:emily}'s case-competition team",
  gave_slot: 'you gave {c:emily} the mock-interview slot',
  replied_gian: "you replied to {c:gian}'s post",
  meetup: 'you went to the data meetup',
  fair_research: 'you researched companies before the fair',
  alumni_list: 'you asked the career center about alumni',
  agenda_sent: 'you sent {c:gian} an agenda',
  met_gian: 'you talked with {c:gian} at the career fair',
  met_molly: 'you met {c:molly} at the career fair',
  strong_fair: 'you opened the career fair with a sharp question',
  followed_up_gian: 'you followed up with {c:gian}',
  asked_gian: 'you sent {c:gian} a tailored question',
  gian_intro: '{c:gian} introduced you to a colleague',
  gian_word: '{c:gian} put in a word for you',
  gave_first: 'you shared something useful with {c:gian} before asking',
  emily_intro: "you took {c:emily}'s intro to her cousin",
  insider_prep: 'you asked a real contact how to prep',
  strong_case: 'you solved the case live',
  gian_referral: '{c:gian} referred you',
  plan_90: 'you sent a 90-day plan',
  work_sample: 'you sent a work sample',
  l2_asked_users: 'you asked who uses the churn report',
  l2_ben_definitions: 'you asked how Finance defines churn',
  l2_helped_ben: 'you helped {c:ben} with his urgent request',
  l2_helped_shalini: 'you helped {c:shalini} during the outage',
  l2_mapped_eng: "you asked {c:shalini} about Engineering's constraints",
  l2_shared_draft: 'you shared an early draft with partners',
  l2_shalini_ally: '{c:shalini} co-presented with you',
  l2_coowned: 'you invited {c:jihee} to co-own the pricing analysis',
  l2_risk_kickoff: 'you ran a risk kickoff with every team',
  l2_prewired_ben: 'you met {c:ben} one-on-one before the review',
  l2_sponsor: '{c:ted} agreed to sponsor your proposal',
  l2_persuaded: "you framed the proposal around each partner's goal",
  l3_stayed: 'you stayed and were promoted in the same company',
  l3_relocated: 'you relocated for a manager role',
  l3_owns_roadmap: 'Teresa gave you formal ownership of the roadmap',
  l3_naveen_path: 'you asked Naveen what he wants and built a path toward it',
  l3_naveen_promoted: 'you made the case for Naveen\'s promotion',
  l3_coalition_built: 'you lined up allies before Teresa decided',
  l3_ben_vouch: 'Ben vouched for your numbers',
  l3_jihee_sponsor: 'Jihee co-sponsored your request',
  l3_shared_hire: 'you proposed a shared analyst with Emily',
  l3_won_budget: 'your team won the headcount',
  l2_working_group: 'you proposed a cross-team working group',
  l2_pilot: 'you lined up pilot partners in advance',
};
