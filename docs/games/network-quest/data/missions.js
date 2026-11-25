// Weekly real-world missions. Targets are per-week (not cumulative), copied
// from the spec tables (§3.2–3.4).

export const LEVELS = {
  1: {
    title: 'Preparing for Career',
    stage: 'Final-semester MSBA student',
    suggestedPersonalGoal: { name: 'Apply for jobs', target: 50, unit: 'applications' },
    chapters: ['Career Fair', 'Alumni Outreach', 'Coffee Chats', 'Interviews', 'The Offer'],
    evidenceNote: 'Level 1 mostly accepts screenshots of outreach or exchanges.',
    missions: [
      {
        id: 'networks', tag: 'Networks', accent: 'teal', glossary: 'networks',
        name: 'New professional outreach', unit: 'people', summaryUnit: 'new professional outreach',
        targets: [1, 2, 3, 4, 5],
        tasks: [
          'Reach out to 1 new professional or alumnus',
          'Reach out to 2 new people',
          'Reach out to 3 new people',
          'Reach out to 4 new people',
          'Reach out to 5 new people',
        ],
        definition: 'Start a professional connection with someone you have not previously approached for networking.',
        example: 'Send a tailored LinkedIn message to an alumnus working in product analytics, asking about their experience.',
        notCount: 'A connection request with no substantive message, a like, or a casual chat with a friend.',
        counting: 'Count distinct people you reached out to. A reply is not required. One message cannot earn credit for both missions.',
      },
      {
        id: 'exchange', tag: 'Exchange', accent: 'amber', glossary: 'exchange',
        name: 'Meaningful professional exchange', unit: 'exchanges', summaryUnit: 'meaningful exchanges',
        targets: [1, 1, 2, 2, 3],
        tasks: [
          'Complete 1 meaningful exchange with an existing contact',
          'Complete 1 meaningful exchange',
          'Complete 2 meaningful exchanges',
          'Complete 2 meaningful exchanges',
          'Complete 3 meaningful exchanges',
        ],
        definition: 'Give or receive useful professional insight, support, or resources in a genuine interaction.',
        example: 'Discuss career paths with a former colleague, or share a relevant job lead with someone.',
        notCount: 'Generic greetings, or a request nobody answered.',
        counting: 'Count distinct meaningful interactions. A later, separate conversation with someone you newly contacted can count. It needs a real two-way interaction, not just a sent request.',
      },
    ],
  },
  2: {
    title: 'Early Career',
    stage: 'New Data Analyst at {oc}',
    suggestedPersonalGoal: { name: 'Gym', target: 3, unit: 'workouts' },
    chapters: ['Onboarding', 'Stakeholder Discovery', 'First Shared Project', 'Building Support', 'Leadership Presentation'],
    evidenceNote: 'Level 2 accepts screenshots or short structured reflections about in-person meetings.',
    missions: [
      {
        id: 'networks', tag: 'Networks', accent: 'teal', glossary: 'networks',
        name: 'Networking', unit: 'people', summaryUnit: 'networking connections',
        targets: [1, 1, 2, 2, 3],
        tasks: [
          'Start or deepen a professional connection with 1 person (inside or outside the company)',
          'Start or deepen a professional connection with 1 person',
          'Start or deepen professional connections with 2 people',
          'Start or deepen professional connections with 2 people',
          'Start or deepen professional connections with 3 people',
        ],
        definition: 'Start or deepen a professional connection with anyone, inside or outside the company: alumni, industry peers, or colleagues on other teams.',
        example: 'A coffee chat with an alumnus at another company, or an intro chat with someone from a different team.',
        notCount: 'Routine meetings you attend anyway, likes, or a connection request with no message.',
        counting: 'Count distinct people. Never upload confidential workplace documents.',
      },
      {
        id: 'coalitions', tag: 'Coalitions', accent: 'violet', glossary: 'coalition',
        name: 'Stakeholder engagement', unit: 'actions', summaryUnit: 'stakeholder engagement actions',
        targets: [1, 1, 2, 2, 3],
        tasks: [
          'Discuss needs or perspectives with 1 stakeholder',
          'Discuss an idea or collaboration with 1 stakeholder',
          'Engage 2 stakeholders about an idea or collaboration',
          'Engage 2 stakeholders about an idea or collaboration',
          'Engage 3 stakeholders about an idea or collaboration',
        ],
        definition: 'Build support among people whose cooperation matters to an initiative. A stakeholder is someone affected by, or able to influence, a decision.',
        example: 'Before proposing a dashboard rollout, ask Sales and Product partners about their concerns and invite feedback.',
        notCount: 'Updates with no real discussion of their needs or ideas. (Disagreement is fine — the action still counts.)',
        counting: 'Count distinct engagement actions. The same person can count for both missions only through separate qualifying actions.',
      },
    ],
  },
  3: {
    title: 'Becoming a Manager',
    stage: 'First-time manager',
    suggestedPersonalGoal: { name: 'Take a course', target: 2, unit: 'hours' },
    chapters: ['New Manager', 'Team Diagnosis', 'Competing Priorities', 'The Budget Fight', 'Leadership Review'],
    evidenceNote: 'Level 3 mostly uses short structured reflections. Use roles, not names, and leave out confidential details.',
    missions: [
      {
        id: 'influence', tag: 'Political capital', accent: 'violet', glossary: 'politicalCapital',
        name: 'Upward relationships', unit: 'actions', summaryUnit: 'upward relationship actions',
        targets: [1, 1, 2, 2, 3],
        tasks: [
          'Take 1 deliberate action to build trust with your boss or a senior manager',
          'Take 1 upward-relationship action (share progress, ask for input, align on priorities)',
          'Take 2 upward-relationship actions',
          'Take 2 upward-relationship actions',
          'Take 3 upward-relationship actions (e.g. seek sponsorship for your team\'s work)',
        ],
        definition: 'Build trust and support with your boss or more senior managers: share progress, ask for input on a decision, align on priorities, or seek sponsorship.',
        example: 'A short update to your director explaining a trade-off and asking for their view.',
        notCount: 'Being cc\'d on a status email, or a meeting where you didn\'t contribute.',
        counting: 'Count distinct deliberate actions. Use roles, not names.',
      },
      {
        id: 'teambuilding', tag: 'Team', accent: 'teal', glossary: 'recognitionFeedback',
        name: 'Recognition or coaching feedback', unit: 'actions', summaryUnit: 'recognition or coaching moments',
        targets: [1, 1, 2, 2, 3],
        tasks: [
          'Give 1 team member specific recognition or coaching feedback',
          'Give 1 recognition or coaching moment',
          'Give 2 recognition or coaching moments',
          'Give 2 recognition or coaching moments',
          'Give 3 recognition or coaching moments',
        ],
        definition: 'Give a team member either specific recognition (what they did and why it mattered) or coaching feedback aimed at their growth. Either one counts.',
        example: 'Tell an analyst that their clear write-up let the client decide a day early, or suggest one way to make their next presentation tighter.',
        notCount: 'A generic "good job", or assigning a task.',
        counting: 'Count distinct recognition or feedback moments. Use roles, not names.',
      },
    ],
  },
};

// Level 1's suggestion is also the starting goal for a brand-new save.
export const DEFAULT_PERSONAL_GOAL = { ...LEVELS[1].suggestedPersonalGoal };

// Quick picks shown as chips in the personal-goal modals.
export const PERSONAL_GOAL_PICKS = [
  { name: 'Gym', target: 3, unit: 'workouts' },
  { name: 'Online course', target: 2, unit: 'hours' },
  { name: 'Attend events', target: 2, unit: 'events' },
  { name: 'Side project', target: 3, unit: 'hours' },
  { name: 'Reading', target: 3, unit: 'chapters' },
  { name: 'Apply for jobs', target: 50, unit: 'applications' },
];

export const PERSONAL_DEF = {
  id: 'personal', tag: 'Personal', accent: 'slate', glossary: null,
  definition: 'One weekly goal you choose. Each level suggests one, and you can change it any time. It stays the same every week (it does not escalate) unless you edit it.',
  example: 'Log a batch, like +3 workouts or +12 applications, with one screenshot of your tracker. No need for a screenshot per item.',
  notCount: 'Anything you do inside the game. Only real-world progress counts.',
  counting: 'Batch counts are fine. Edits to the goal take effect next week unless you choose "apply now".',
};
