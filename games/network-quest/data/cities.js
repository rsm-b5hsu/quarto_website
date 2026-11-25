// Job offers at the end of Level 1, and how each one shapes Level 2.
// All companies are fictional. Level 3 can reuse this file (relocation choice).
// Tokens: lines may use {co} (company) and {city}, which resolve from state.offer in Level 2.
import { say, nar } from './lines.js';

export const COMPARE_ROWS = [
  ['pay', 'Pay'],
  ['growth', 'Growth & learning'],
  ['network', 'Network size'],
  ['afterWork', 'After-work culture'],
  ['stress', 'Cost of living / stress'],
  ['community', 'Community & belonging'],
];

export const CITIES = {
  atlanta: {
    city: 'Atlanta, GA', short: 'Atlanta', company: 'Northwind Analytics', industry: 'Supply chain & logistics analytics', role: 'Data Analyst',
    blurb: 'The team you interviewed with all along: routing, inventory and delivery data for retail clients.',
    compare: {
      pay: 'Middle of the range',
      growth: 'Steady, broad exposure to clients',
      network: 'Mid-sized analytics scene',
      afterWork: 'Some meetups; evenings mostly free',
      stress: 'Moderate cost of living, balanced hours',
      community: 'Large Taiwanese and Asian community nearby',
    },
    eligible: null, // always offered
    l2: {
      intro: [
        nar('Atlanta. {co} sits next to a freight rail line; you can hear the trains during standup.'),
        nar('Your days are routing models and delivery data. Evenings are yours, and the Taiwanese community nearby feels like a second home.'),
      ],
      prologue: {
        office: [
          nar('{co} fills two floors of a converted cotton warehouse in Midtown Atlanta. Exposed brick, a wall-sized map of every warehouse the clients run, and a kitchen that smells like coffee and peaches.'),
          nar('The team is about forty people. By lunch, three of them have already asked where you\'re from and whether you\'ve tried the hot chicken place downstairs.'),
        ],
        evening: [
          nar('That evening you take the train home past the BeltLine. Your one-bedroom costs less than you feared, and it already has a balcony.'),
          nar('On Saturday you find a bubble-tea shop run by a family from Tainan. The owner gives you an extra topping "for the new neighbor."'),
        ],
        stakes: [
          say('ted', 'One more thing: our biggest client renews in six months. They want to see that our delivery forecasts actually save them money. Your dashboards will be part of that story.'),
        ],
      },
      activityWeights: { health: 1.3 },
      eventWeights: {},
      mods: { healthRecovery: 4 },
      modsText: 'Balanced: rest and gym restore 4 extra Health.',
      uncertainty: {
        lines: [
          say('ted', 'News: leadership approved a team expansion. Three new analysts next month — and they report to the dashboard you\'re building.', 'happy'),
          nar('More people depend on your work now. More visibility, and more to get right.'),
        ],
        effects: { inf: 2, cc: -1 },
        note: 'Team expansion: more visibility, more pressure.',
      },
    },
    l3: {
      role: 'Analytics Manager',
      eligible: { any: [{ flag: 'l2_sponsor' }, { meterGte: ['inf', 60] }] },
      notOfferedReason: 'Needed {c:ted} as a sponsor, or Influence 60+, for Northwind to recruit you.',
      referral: '{c:ted} knows the Northwind analytics director from a conference — he made the call.',
      prologue: {
        arrival: [
          nar('Atlanta again — or for the first time. The moving truck gets lost twice in Midtown. You don\'t mind; the bubble-tea shop near your new place is open late.'),
        ],
        office: [
          nar('{co}\'s analytics floor sits above the client operations team. Your new title is on a small sign outside a glass room you now book for one-on-ones every afternoon.'),
        ],
        evening: [
          nar('Evenings are quieter than you expected. You use them to read your team\'s old project notes, trying to understand what they built before you arrived.'),
        ],
        stakes: [
          say('teresa', 'Our biggest client renews next quarter. They want forecasts they can plan trucks around. Your team owns that forecast now.'),
        ],
      },
      twist: {
        lines: [
          say('teresa', 'The client asked for a second region next month. Same team, same deadline, twice the scope.', 'concerned'),
          nar('Growth is good news that lands on your team\'s calendar.'),
        ],
        effects: { morale: -5, pc: 5 },
        note: 'Client expansion: more visibility, more pressure on the team.',
      },
    },
  },

  seattle: {
    city: 'Seattle, WA', short: 'Seattle', company: 'Cascade Cloud', industry: 'Big tech (cloud platform)', role: 'Data Analyst, Growth',
    blurb: 'A large cloud company. Huge datasets, famous brand, and a lot of very smart colleagues.',
    compare: {
      pay: 'Highest of the four',
      growth: 'Deep specialization, strong mentors',
      network: 'Largest — thousands of analysts',
      afterWork: 'Many team events; easy to get lost in the crowd',
      stress: 'High cost of living; competition for attention',
      community: 'Diverse, but big and spread out',
    },
    eligible: { meterGte: ['cc', 55] },
    notOfferedReason: 'Needed Career Capital 55+ by the final round.',
    l2: {
      intro: [
        nar('Seattle. {co}\'s campus has four cafeterias and a building just for meetings.'),
        nar('There are more analysts here than in your entire graduating class. Getting noticed will take effort.'),
      ],
      prologue: {
        office: [
          nar('Orientation is in an auditorium with two hundred other new hires. Free hoodies, a keynote about "customer obsession," and a campus map you will need for weeks.'),
          nar('Your team sits on the ninth floor of a glass building by Lake Union. Every meeting room is named after a mountain. You get lost twice looking for "Rainier."'),
        ],
        evening: [
          nar('It drizzles every afternoon of your first week. Your studio in Capitol Hill is small and expensive, but the view of the Space Needle almost makes up for it.'),
          nar('There is a team happy hour on Thursday with eighty people. You talk to six of them and remember two names. It\'s a start.'),
        ],
        stakes: [
          say('ted', 'Honest advice: here, good work doesn\'t get noticed by itself. There are a hundred good analysts. The ones who move up are the ones other teams ask for by name.'),
        ],
      },
      activityWeights: { social: 1.3 },
      eventWeights: {},
      mods: { socialBonus: 0.15, infCheckAdj: 5 },
      modsText: 'Large network: social activities succeed more often, but Influence checks are 5 points harder (competition for attention).',
      uncertainty: {
        lines: [
          say('ted', 'Heads up: there\'s a reorg. Our team moves under a new director next month.', 'concerned'),
          nar('Your project might be someone else\'s priority now — or nobody\'s. Relationships across teams suddenly matter more.'),
        ],
        effects: { inf: -2, ns: 1 },
        note: 'Reorg: your sponsor chain changed.',
      },
    },
    l3: {
      role: 'Analytics Manager, Growth',
      eligible: { trustGte: ['jihee', 3] },
      notOfferedReason: 'Came through {c:jihee}\'s former manager at Cascade Cloud — needed trust 3+ with her.',
      referral: '{c:jihee}\'s former manager now runs growth marketing at Cascade Cloud. Jihee sent your name.',
      prologue: {
        arrival: [
          nar('Seattle in October: the rain starts and doesn\'t really stop until June. You buy a proper jacket on day two.'),
        ],
        office: [
          nar('{co}\'s campus is enormous. Your team of three sits between two teams of twenty, and your name is spelled wrong on the org chart for a week.'),
        ],
        evening: [
          nar('There are manager meetups every week here: "First-Time Managers Circle," "Leading Through Ambiguity." Everyone seems to be figuring it out at the same time.'),
        ],
        stakes: [
          say('teresa', 'In a company this big, small teams disappear unless someone fights for them. Planning season starts in a month. Make sure we\'re in the plan.'),
        ],
      },
      twist: {
        lines: [
          say('teresa', 'Reorg news: our org now reports to a new SVP. Every team has to re-justify its roadmap.', 'concerned'),
          nar('Everything you planned is suddenly up for discussion again.'),
        ],
        effects: { pc: -5, morale: -3 },
        note: 'Reorg: every roadmap is up for review.',
      },
    },
  },

  phoenix: {
    city: 'Phoenix, AZ', short: 'Phoenix', company: 'Formosa Silicon Arizona', industry: 'Semiconductor manufacturing', role: 'Data Analyst, Fab Operations',
    blurb: 'A Taiwanese-owned chip fab ramping up production. Yield, equipment and supply data.',
    compare: {
      pay: 'Above middle, with a ramp-up bonus',
      growth: 'Fast — a new site, manufacturing domain expertise',
      network: 'Small local analytics community',
      afterWork: 'Quiet; team dinners with Taiwanese colleagues',
      stress: 'Moderate cost; early fab-shift culture, harsh summers',
      community: 'Close-knit team, many Taiwanese colleagues',
    },
    eligible: { any: [{ flag: 'gian_referral' }, { trustGte: ['gian', 3] }] },
    notOfferedReason: 'Came through a referral from {c:gian} — needed his referral or trust 3+ with him.',
    l2: {
      intro: [
        nar('Phoenix. {co}\'s fab runs around the clock; the analysts start at 7 a.m. to catch the shift handover.'),
        nar('Half your team trained in Hsinchu. The network here is small — but people remember who helped them.'),
      ],
      prologue: {
        office: [
          nar('{co}\'s site is in north Phoenix, a huge white building surrounded by desert and construction cranes. Before you can enter the fab area, you learn to put on a full-body cleanroom suit.'),
          nar('The analysts sit in an office wing overlooking the production floor. Signs are in English and Chinese, and the morning meeting switches between both.'),
        ],
        evening: [
          nar('It is 41°C at 5 p.m. You learn quickly why everyone parks in the shade and runs errands after dark.'),
          nar('On Friday, half the team goes out for hot pot. Someone who moved from Hsinchu last year gives you a list of the best grocery stores. You feel at home faster than expected.'),
        ],
        stakes: [
          say('ted', 'Here\'s our reality: this fab ramps production in six months. Every week of delay costs a fortune. Your yield dashboard has to be something engineers actually check at 7 a.m.'),
        ],
      },
      activityWeights: { social: 0.7, work: 1.3 },
      eventWeights: {},
      mods: { contactTrust: 2 },
      modsText: 'Small, high-trust network: new contacts start at trust 2, but there are fewer social events.',
      uncertainty: {
        lines: [
          say('ted', 'The fab ramp is delayed a quarter. A tool shipment is stuck.', 'concerned'),
          nar('Your yield dashboard has less data to show for now. A good decision is not a guaranteed outcome.'),
        ],
        effects: { cc: -2, ns: 1 },
        note: 'Fab ramp delay.',
      },
    },
    l3: {
      role: 'Analytics Manager, Fab Operations',
      eligible: { trustGte: ['shalini', 3] },
      notOfferedReason: 'Came through {c:shalini}\'s engineering network — needed trust 3+ with her.',
      referral: '{c:shalini}\'s former teammate leads the fab\'s data platform. Shalini told her you\'re the one to hire.',
      prologue: {
        arrival: [
          nar('Phoenix in spring: warm, bright, and the desert is blooming. You\'ve been told to enjoy it before summer.'),
        ],
        office: [
          nar('{co} has finished its first production line. Your team sits next to the yield engineers, and your morning starts with the 7 a.m. shift handover.'),
        ],
        evening: [
          nar('The Taiwanese colleagues invite you to a Friday night market. You learn more about how decisions really get made there than in a week of meetings.'),
        ],
        stakes: [
          say('teresa', 'Line two ramps this quarter. If yield data is late, engineers make decisions blind. Your team is the early warning system.'),
        ],
      },
      twist: {
        lines: [
          say('teresa', 'A key tool supplier is delayed again. Line two slips six weeks, and headquarters wants weekly updates on why.', 'concerned'),
          nar('Your team will spend a month explaining a problem it didn\'t cause.'),
        ],
        effects: { morale: -5, cc: 2 },
        note: 'Supplier delay: more reporting pressure.',
      },
    },
  },

  nyc: {
    city: 'New York, NY', short: 'NYC', company: 'Hudson Ledger', industry: 'Fintech (payments)', role: 'Data Analyst, Risk',
    blurb: 'A fast-growing payments startup. Fraud models, real-time dashboards, and very fast feedback.',
    compare: {
      pay: 'High, with equity',
      growth: 'Very fast learning, little structure',
      network: 'Large, dense, constantly changing',
      afterWork: 'Events almost every night',
      stress: 'Very high cost; high stress, Health drains faster',
      community: 'Lots of communities, little time for them',
    },
    eligible: { any: [{ flag: 'strong_fair' }, { flag: 'gave_first' }, { flag: 'impressed_gian' }, { flag: 'insider_prep' }, { flag: 'plan_90' }, { flag: 'negotiated' }] },
    notOfferedReason: 'Came from a bold move — needed at least one ⚡ Momentum choice in Level 1.',
    l2: {
      intro: [
        nar('New York. {co}\'s office is two floors above a bagel shop and one floor below a different startup.'),
        nar('There is an industry event every night. The work moves fast, and so does everyone around you.'),
      ],
      prologue: {
        office: [
          nar('{co} rents three floors in the Flatiron District. The office is loud: open desks, a gong for every new merchant signed, and a fraud-alert screen that never stops scrolling.'),
          nar('There is no formal orientation. Your laptop arrives at 10 a.m., and by noon someone has added you to fourteen Slack channels.'),
        ],
        evening: [
          nar('Your apartment in Queens is a 35-minute subway ride away and takes almost half your paycheck. Your first night, you eat dumplings standing at the counter because the table hasn\'t arrived yet.'),
          nar('By Wednesday you have three invitations: a fintech meetup, a data-science talk, and a rooftop party for someone\'s startup launch. You could go out every night. You probably shouldn\'t.'),
        ],
        stakes: [
          say('ted', 'We grew 3x last year, so everything is a little on fire. That\'s the opportunity: if you can help Risk and Finance agree on one set of numbers, people will notice fast.'),
        ],
      },
      activityWeights: { social: 1.6, health: 0.8 },
      eventWeights: {},
      mods: { healthDrain: 3 },
      modsText: 'Fast-paced: more after-work events, but Health drops 3 extra points every day.',
      uncertainty: {
        lines: [
          say('ted', 'I wanted you to hear it from me: I\'m leaving next quarter. I\'ll be here through your presentation.', 'concerned'),
          nar('The person who championed your project is leaving. Who else in the building knows your work?'),
        ],
        effects: { inf: -1, ns: 1 },
        note: 'Your manager is leaving.',
      },
    },
    l3: {
      role: 'Analytics Manager, Risk',
      eligible: { trustGte: ['ben', 3] },
      notOfferedReason: 'Came through {c:ben}\'s finance contact at Hudson Ledger — needed trust 3+ with him.',
      referral: '{c:ben}\'s old classmate is now CFO at Hudson Ledger. Ben vouched for your numbers.',
      prologue: {
        arrival: [
          nar('New York. Your new apartment is smaller than your old one and costs more. The subway becomes your thinking time.'),
        ],
        office: [
          nar('{co} has doubled in size since last year. Your team of three inherited a fraud dashboard nobody fully understands and a backlog with 140 tickets.'),
        ],
        evening: [
          nar('There\'s a leadership talk or a fintech mixer every night. You learn to say no to most of them — and to pick the one that matters.'),
        ],
        stakes: [
          say('teresa', 'We\'re raising our next round in six months. Investors will ask how good our fraud numbers are. Your team owns the answer.'),
        ],
      },
      twist: {
        lines: [
          say('teresa', 'A regulator sent a data request — due in three weeks. It jumps to the top of every queue, including yours.', 'concerned'),
          nar('Fast-moving companies get surprises. This one lands on your team.'),
        ],
        effects: { morale: -4, pc: 4 },
        note: 'Regulatory request: urgent, visible, exhausting.',
      },
    },
  },
};

export const CITY_ORDER = ['atlanta', 'seattle', 'phoenix', 'nyc'];
// Relocation options are filled in this order when not enough are earned.
export const RELOCATE_FILL = ['seattle', 'nyc', 'atlanta', 'phoenix'];
export const DEFAULT_CITY = 'atlanta';
