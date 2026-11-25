// Level prologues: background story that plays once when a level begins, before Week 1.
// Level 2 is one shared skeleton; the { insert: 'city…' } lines come from data/cities.js
// (l2.intro, l2.prologue.office / evening / stakes) for the offer you accepted.
// Tokens as elsewhere: {c:id}, {p}, {co}, {oc}, {city}, {t:term|label}.
import { say, nar, me, when, branch, otherwise } from './lines.js';

export const PROLOGUES = {
  1: {
    title: 'Final semester',
    npc: 'emily',
    lines: [
      nar('January. The last semester of your MSBA program.'),
      nar('Your coursework is going well: SQL, forecasting, an experiment-design project you are proud of. Your job search has not really started yet.'),
      me('Everyone keeps asking where I\'m going after graduation. I keep saying "somewhere with interesting data."'),
      nar('Your laptop has a folder named "Job search" with one file in it: a resume you last edited in October.'),
      say('emily', '{p}! Did you see the career fair is in two weeks? I already have a spreadsheet of companies.', 'happy'),
      say('emily', 'Color-coded. Don\'t ask to see it — you\'d steal my targets.'),
      me('You\'re joking.', 'happy'),
      say('emily', 'Half joking. We\'re probably applying to the same jobs, so — may the best analyst win.', 'happy'),
      nar('{c:emily} is the friendliest competition you have ever had.'),
      nar('After class, {c:mercer} stops you on the way out.'),
      say('mercer', 'You look like someone with a plan forming. How is the search going?'),
      me('Honestly? I\'ve been waiting until I feel ready.', 'concerned'),
      say('mercer', 'Most people feel that way. Small steps taken early tend to add up. I\'m glad to hear how it goes — come by office hours any time.', 'happy'),
      nar('Over the next five weeks you will decide, again and again, where your limited time and Energy go: polishing skills, meeting people, or asking for help.'),
      nar('In this game, the story only moves forward when you do something in real life — an outreach message, a real conversation. Game choices never count toward those missions.'),
      me('Goal: a data analyst offer before graduation. Let\'s go.', 'happy'),
    ],
  },

  2: {
    title: 'First week at {oc}',
    npc: 'ted',
    lines: [
      nar('Graduation was a blur of caps, photos and goodbyes.'),
      [
        when({ flag: 'helped_emily' }, say('emily', 'Text me after your first day. I want a full report. We\'re still trading referrals for the next decade.', 'happy')),
        otherwise(nar('{c:emily} sent a short "good luck" message the night before your flight. It meant more than you expected.')),
      ],
      { insert: 'offerIntro' },
      nar('Monday, 8:45 a.m. A badge photo, a laptop that needs three updates, and a welcome email with forty links.'),
      { insert: 'cityOffice' },
      say('ted', 'You must be {p}. I\'m {c:ted} — I run the analytics team here at {co}. Welcome.', 'happy'),
      [
        when({ flag: 'gian_referral' }, say('ted', '{c:gian} told me you were worth hiring early. I trust his judgment, so no pressure.', 'happy')),
        otherwise(say('ted', 'Your case interview was one of the clearest we saw. That\'s why you\'re here.')),
      ],
      say('ted', 'Let me tell you the thing nobody told me in my first job: the analysis is usually the easy part.'),
      say('ted', 'The hard part is knowing who needs it, what they will do with it, and who has to agree before anything changes.'),
      me('So… less modeling, more people?'),
      say('ted', 'Same modeling. Plus people. Come on, I\'ll introduce you to the three teams you\'ll work with most.', 'happy'),
      say('ben', 'Ben, Finance. If a number shows up in a budget meeting, I need to know where it came from.'),
      say('jihee', 'Jihee, Marketing! We run all the campaigns, which means we ask for data… a lot. Sorry in advance.', 'happy'),
      say('shalini', 'Shalini, Engineering. I own the data pipelines. If a dashboard breaks at 2 a.m., it\'s my phone that rings.', 'concerned'),
      nar('Three teams, three priorities, three definitions of "success." Working across them is called {t:crossfunctional|cross-functional} work.'),
      { insert: 'cityEvening' },
      { insert: 'cityStakes' },
      nar('In school, being good at the work was enough. Here, the work only matters if the right {t:stakeholder|stakeholders} trust it and use it.'),
      nar('Your new real-world missions: networking — starting or deepening a professional connection with anyone, inside or outside the company — and stakeholder engagement. The people you met in Level 1 are still part of your network.'),
      me('New city. New team. Same plan: make the small moves early.', 'happy'),
    ],
  },

  3: {
    title: 'Becoming a manager at {co}',
    npc: 'teresa',
    lines: [
      // 1. Who you are now
      nar('A year has passed since your first day as an analyst.'),
      [
        when({ flag: 'l2_sponsor' }, nar('Your leadership presentation went well — {c:ted} sponsored it, and people still mention the retention dashboard in meetings.')),
        when({ flag: 'l2_persuaded' }, nar('Your retention project shipped because three teams backed it, each for their own reason. People noticed how you got there.')),
        otherwise(nar('Your retention project shipped. It was not always smooth, but you learned who decides things and how.')),
      ],
      [
        branch({ flag: 'l3_stayed' },
          say('ted', 'I\'ll get straight to it: you\'re getting a team. Three analysts. Congratulations, manager.', 'happy'),
          me('Me? I still feel like the new person.', 'concerned'),
          say('ted', 'Everyone does at first. You\'re not managing alone — I\'m two doors down.', 'happy')),
        otherwise(
          nar('You took the {t:longDistance|long-distance} leap: a manager role at {co} in {city}.'),
          { insert: 'l3Referral' }),
      ],
      // 2. Where you are
      [
        branch({ flag: 'l3_stayed' },
          nar('Same building, new desk. Your calendar now has one-on-ones where focus time used to be.'),
          nar('Your old teammates smile a little differently at you now. Some hope you change nothing. Some hope you change everything.')),
        otherwise(
          { insert: 'l3Arrival' },
          { insert: 'l3Office' }),
      ],
      // 3. Who you meet
      say('teresa', 'Welcome. I\'m Teresa — VP, and your skip-level. My door is open, and my calendar is not, so make our time count.'),
      say('teresa', 'Here is what matters this quarter: your team delivers, your people grow, and in budget season you make a clear case for what you need. Budgets are tight. Not everyone will get what they ask for.'),
      [
        branch({ flag: 'helped_emily' },
          say('emily', '{p}?! No way. They hired me to run the platform analytics team. Remember when you fixed my resume at 9 p.m.?', 'happy'),
          say('emily', 'I owe you one. Fair warning though — we\'re probably asking for the same headcount.', 'happy')),
        branch({ flag: 'declined_emily' },
          say('emily', '{p}. It\'s been a while. I lead the platform analytics team now.'),
          nar('She\'s polite. You remember the night you were too busy to help her — and suspect she does too.'),
          say('emily', 'Looks like we\'ll both be in the budget meeting. Should be interesting.')),
        otherwise(
          say('emily', '{p}! From classmates to peer managers. I run the platform analytics team now.', 'happy'),
          say('emily', 'Friendly rivals again? We\'ll be competing for the same budget, I think.')),
      ],
      nar('Then you meet your team.'),
      say('naveen', 'Naveen. I built most of the models this team runs on. Happy to help you get up to speed.', 'happy'),
      nar('He\'s excellent — and his phone keeps lighting up with messages from a recruiter.'),
      say('ashley', 'Hi, I\'m Ashley — I started three weeks ago. Sorry, is it okay if I ask a lot of questions? I don\'t want to slow anyone down.', 'concerned'),
      say('ray', 'Ray. Fifteen years here. You\'re my fourth manager. No offense, but I\'ll wait and see.'),
      // 4. Your network
      nar('Your network from Level 2 is still with you:'),
      { insert: 'networkRecap' },
      [
        branch({ flag: 'l3_relocated' }, { insert: 'l3Evening' }),
        otherwise(nar('That evening, {c:ted} sends a short message: "First rule of managing: your calendar is now your team\'s. Protect it."')),
      ],
      // 5. The challenges
      nar('As an analyst, you did the work yourself. Now the work gets done through people — people with their own goals, worries and plans.'),
      nar('Two new things to watch: {t:teamMorale|Team Morale} (how your reports feel) and {t:politicalCapital|Political Capital} (your credibility with leadership and peers).'),
      nar('Many decisions can go two ways: {t:softPower|soft power} (build the team, act on others\' needs, line up allies) or {t:hardPower|hard power} (evidence, authority, credibility). Neither is always right — it depends on the moment.'),
      { insert: 'l3Stakes' },
      // 6. Real-world missions
      nar('Your new real-world missions: build upward relationships with your boss or senior leaders (your real-world political capital), and give your team specific recognition or coaching feedback. Log them as short reflections — roles, not names, and nothing confidential.'),
      me('Plan: listen first, decide second, and make sure my team knows I\'m on their side.', 'happy'),
    ],
  },
};
