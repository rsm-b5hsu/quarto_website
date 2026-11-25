// Daily activities (after the day's event). Five are drawn each day; Rest is always one.
// In-game activities never count toward real-world missions.
//   energy:   Energy cost
//   tags:     social | course | health | work   (city weights in Level 2 use these)
//   levels:   which levels it appears in (omit = all)
//   requires: condition (shown greyed out with the reason when not met)
//   outcomes: [{ p, label, good, text, reason?, effects, consolation? }]
//     p      — probability (shown to the player before choosing)
//     label  — short line in the odds table
//     reason — why a bad roll went badly
//     consolation — { chance, text, effects } small upside on a bad roll
// Extra effects: health: ±n, skill: { communication|persuasion|teamwork: 1 },
//                newContact: true (meet someone new), trustRandom: 1 (someone you know)

export const ACTIVITIES = [
  {
    id: 'rest', name: 'Rest', icon: '🌙', energy: 1, tags: ['health'], always: true,
    outcomes: [
      { p: 1, good: true, label: '+10 Health and +1 Energy tomorrow', text: 'An early night. Tomorrow-you says thanks.', effects: { health: 10, carry: 1 } },
    ],
  },
  {
    id: 'gym', name: 'Gym', icon: '🏋️', energy: 1, tags: ['health'],
    outcomes: [
      { p: 0.85, good: true, label: 'A good workout (+10 Health)', text: 'Forty minutes, one new personal best, zero emails.', effects: { health: 10 } },
      { p: 0.15, good: false, label: 'Gym is packed', reason: 'Every machine was taken. You stretched and left.', text: '', effects: { health: 3 } },
    ],
  },
  {
    id: 'mixer', name: 'Industry mixer', icon: '🥂', energy: 2, tags: ['social'],
    outcomes: [
      { p: 0.55, good: true, label: 'Meet a useful contact (new contact at trust 1)', text: 'One conversation goes past small talk. You trade contact info.', effects: { ns: 3, newContact: true, health: -4 } },
      { p: 0.45, good: false, label: 'No useful connections', reason: 'Mostly sales pitches tonight.', text: '', effects: { health: -4 },
        consolation: { chance: 0.4, text: 'At least the speaker\'s talk was good.', effects: { inf: 1 } } },
    ],
  },
  {
    id: 'panel', name: 'Alumni panel', icon: '🎤', energy: 1, tags: ['social'], levels: [1],
    outcomes: [
      { p: 0.6, good: true, label: 'Ask a question, meet a panelist (new contact)', text: 'You ask one specific question; a panelist finds you afterward.', effects: { ns: 2, inf: 1, newContact: true } },
      { p: 0.4, good: false, label: 'Panel runs long, no Q&A', reason: 'The moderator talked for 40 minutes. No time for questions.', text: '', effects: { ns: 1 } },
    ],
  },
  {
    id: 'happyhour', name: 'Team happy hour', icon: '🍹', energy: 1, tags: ['social'],
    outcomes: [
      { p: 0.7, good: true, label: 'Get to know someone better (+1 trust)', text: 'Someone you know tells you what they are actually working on.', effects: { ns: 2, trustRandom: 1, health: -3 } },
      { p: 0.3, good: false, label: 'Small talk only', reason: 'The whole table talked about fantasy football.', text: '', effects: { health: -3 } },
    ],
  },
  {
    id: 'volunteer', name: 'Volunteer', icon: '🤲', energy: 2, tags: ['social'],
    outcomes: [
      { p: 0.8, good: true, label: 'Work alongside new people (+Network, +Influence)', text: 'You teach spreadsheet basics at a community center. Three people ask for your email.', effects: { ns: 2, inf: 2, health: 2 } },
      { p: 0.2, good: false, label: 'Event cancelled', reason: 'Cancelled for rain — the email came after you arrived.', text: '', effects: {},
        consolation: { chance: 1, text: 'You walked home. Fresh air counts.', effects: { health: 3 } } },
    ],
  },
  {
    id: 'comm', name: 'Communication workshop', icon: '💬', energy: 2, tags: ['course'],
    outcomes: [
      { p: 0.7, good: true, label: 'Communication skill +1', text: 'You learn to lead with the conclusion. Your updates get shorter and clearer.', effects: { skill: { communication: 1 }, inf: 1 } },
      { p: 0.3, good: false, label: 'Nothing sticks', reason: 'Interesting session, but nothing you could use yet.', text: '', effects: { cc: 1 } },
    ],
  },
  {
    id: 'persuasion', name: 'Persuasion course', icon: '🎯', energy: 2, tags: ['course'],
    outcomes: [
      { p: 0.65, good: true, label: 'Persuasion skill +1', text: 'You practice framing a request around the other person\'s goals.', effects: { skill: { persuasion: 1 }, inf: 2 } },
      { p: 0.35, good: false, label: 'Nothing sticks', reason: 'The role-plays felt awkward. You\'ll try again.', text: '', effects: {},
        consolation: { chance: 0.5, text: 'Your partner in the role-play was a recruiter. You connect.', effects: { ns: 1 } } },
    ],
  },
  {
    id: 'teamwork', name: 'Teamwork workshop', icon: '🧩', energy: 2, tags: ['course'],
    outcomes: [
      { p: 0.7, good: true, label: 'Teamwork skill +1', text: 'You practice running a meeting where everyone talks, not just the loudest.', effects: { skill: { teamwork: 1 }, ns: 1 } },
      { p: 0.3, good: false, label: 'Nothing sticks', reason: 'Half the exercises were icebreakers.', text: '', effects: { ns: 1 } },
    ],
  },
  {
    id: 'sql', name: 'Online SQL class', icon: '🧮', energy: 1, tags: ['work', 'course'],
    outcomes: [
      { p: 0.8, good: true, label: 'Finish a module (+3 Career Capital)', text: 'Window functions finally make sense.', effects: { cc: 3 } },
      { p: 0.2, good: false, label: 'Video keeps buffering', reason: 'The video froze every ninety seconds.', text: '', effects: { cc: 1 } },
    ],
  },
  {
    id: 'sideproject', name: 'Side project', icon: '🛠', energy: 2, tags: ['work'],
    outcomes: [
      { p: 0.6, good: true, label: 'Ship a feature (+5 Career Capital)', text: 'Your dashboard project gets a new chart and a README.', effects: { cc: 5, health: -3 } },
      { p: 0.4, good: false, label: 'A bug eats the evening', reason: 'A dependency update broke everything. You fixed it at midnight.', text: '', effects: { cc: 1, health: -5 } },
    ],
  },
  {
    id: 'news', name: 'Read industry news', icon: '📰', energy: 1, tags: ['work'],
    outcomes: [
      { p: 0.9, good: true, label: 'Learn something to bring up (+Influence)', text: 'You find a trend worth mentioning in your next conversation.', effects: { inf: 1, cc: 1 } },
      { p: 0.1, good: false, label: 'Clickbait', reason: 'Three articles, all the same press release.', text: '', effects: {} },
    ],
  },
  {
    id: 'coffee', name: 'Coffee with someone you know', icon: '☕', energy: 1, tags: ['social'],
    requires: { contactsGte: 1 }, lockedHint: 'Meet someone new first (mixer, panel or volunteering).',
    outcomes: [
      { p: 0.75, good: true, label: 'Deepen a relationship (+1 trust)', text: 'Thirty minutes, one useful tip, and a promise to keep in touch.', effects: { ns: 1, trustRandom: 1 } },
      { p: 0.25, good: false, label: 'They reschedule', reason: 'Something came up on their side. You rebook for next week.', text: '', effects: {} },
    ],
  },
  {
    id: 'mockcase', name: 'Mock-case practice', icon: '📊', energy: 1, tags: ['work'], levels: [1],
    outcomes: [
      { p: 0.7, good: true, label: 'Solve a case (+3 Career Capital)', text: 'You size the market in four minutes and explain it out loud.', effects: { cc: 3 } },
      { p: 0.3, good: false, label: 'Get stuck', reason: 'You froze on the first assumption.', text: '', effects: { cc: 1 } },
    ],
  },
  {
    id: 'lunchlearn', name: 'Lunch & learn', icon: '🥪', energy: 1, tags: ['social', 'course'], levels: [2, 3],
    outcomes: [
      { p: 0.7, good: true, label: 'Meet another team (+Network, +Influence)', text: 'Another team presents their roadmap. You ask the question everyone was thinking.', effects: { ns: 1, inf: 1 } },
      { p: 0.3, good: false, label: 'Talk is too basic', reason: 'It was a product demo you had already seen.', text: '', effects: {} },
    ],
  },
];

// Level 3 activities live in the same list (filtered by `levels`).
ACTIVITIES.push(
  {
    id: 'teamlunch', name: 'Team lunch', icon: '🌮', energy: 1, tags: ['social'], levels: [3],
    outcomes: [
      { p: 0.8, good: true, label: 'Team bonds over tacos (+Team Morale)', text: 'Ray tells a story from 2011. Ashley laughs so hard she cries.', effects: { morale: 4, ns: 1 } },
      { p: 0.2, good: false, label: 'Half the team is busy', reason: 'Two people had a deadline. Lunch for two.', text: '', effects: { morale: 1 } },
    ],
  },
  {
    id: 'skiplevel', name: 'Coffee with a senior leader', icon: '🏢', energy: 1, tags: ['work', 'social'], levels: [3],
    outcomes: [
      { p: 0.6, good: true, label: 'Share your team\'s wins (+Political Capital)', text: 'Twenty minutes, one good question from them, and your team\'s project is on their radar.', effects: { pc: 3, inf: 1 } },
      { p: 0.4, good: false, label: 'Meeting cancelled', reason: 'Their calendar exploded. Rescheduled for next month.', text: '', effects: {} },
    ],
  },
);

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
export const DAILY_ACTIVITY_COUNT = 5;
