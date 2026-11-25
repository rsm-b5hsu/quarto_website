// Daily events. Each week draws from its own themed events plus a few general ones.
//   weeks: [..] — weeks the event can appear in (omit = any week of the level)
//   npc:        — who stands on the right by default
//   lines:      — 2–4 short lines before the choices
//   choice:     { label, say?, cost (Energy), momentum?, requires?, lockedHint?, effects, result: lines }
//     say      — what Sean says when picking it (otherwise the label shows as an action)
// Effects:  cc = Career Capital, ns = Network Strength, inf = Influence,
//           trust: { npcId: ±n }, flags: [...], carry: 1 (bank 1 Energy for tomorrow)
import { say, nar, me, when } from './lines.js';

export const EVENTS = {
  1: [
    /* ---------- General (any week) ---------- */
    {
      id: 'l1_exam_week', title: 'Exam week', npc: 'mercer',
      lines: [
        nar("It's exam week. Your Managerial Decision Making exam is Thursday."),
        say('mercer', 'Office hours are open this afternoon, if anyone wants to work through a problem.', 'happy'),
      ],
      choices: [
        { label: 'Study alone in the library', cost: 2, effects: { cc: 5 },
          result: [nar('Six hours, four practice problems, one vending-machine dinner. You are ready.')] },
        { label: 'Go to office hours', say: 'Could we walk through a practice problem?', cost: 1,
          effects: { cc: 2, inf: 1, trust: { mercer: 1 }, flags: ['office_hours'] },
          result: [
            say('mercer', "Of course. And afterward — tell me what you're planning after graduation.", 'happy'),
            say('mercer', "When you're torn between two options, write down what each one costs you. The cost you don't write down is often the one deciding for you."),
            nar("That's {t:opportunityCost|opportunity cost}, in one sentence."),
          ] },
        { label: 'Study group with {c:emily}', say: 'Want to quiz each other?', cost: 1, effects: { cc: 2, trust: { emily: 1 } },
          result: [say('emily', 'Okay — expected value. Explain it to me like I\'m a CFO.', 'happy'), nar('She explains it back better than you did. Annoying. Useful.')] },
      ],
    },
    {
      id: 'l1_meetup', title: 'Downtown data meetup', npc: 'narrator',
      lines: [
        nar('A classmate invites you to a data meetup at a downtown startup.'),
        nar('Free pizza. Possibly free career advice. Definitely a 40-minute bus ride.'),
      ],
      choices: [
        { label: 'Go and talk to three strangers', cost: 2, effects: { ns: 4, inf: 1, flags: ['meetup'] },
          result: [nar('Two of the three strangers are also students. The third is a hiring manager who says "stay in touch."'), nar('Networking is a long game.')] },
        { label: 'Skip it and get a full night of sleep', cost: 1, effects: { cc: 1, carry: 1, health: 6 },
          result: [nar('You sleep nine hours. Tomorrow-you is grateful.')] },
        { label: 'Ask your classmate to share notes', say: 'Can you send me your notes after?', cost: 1, effects: { ns: 1 },
          result: [nar('The notes say "pizza was good" and "ask about dbt??"')] },
      ],
    },
    {
      id: 'l1_late_night', title: '11 p.m.', npc: 'narrator',
      lines: [nar("It's 11 p.m. You have nothing left."), me('My to-do list has opinions.', 'concerned')],
      choices: [
        { label: 'Go to sleep', cost: 1, effects: { carry: 1, health: 8 },
          result: [nar("The to-do list is still there in the morning. So are you, and you're sharper.")] },
        { label: 'Push through one more task', cost: 2, effects: { cc: 3, inf: -1, health: -8 },
          result: [nar('Done — and morning-you is noticeably less charming in seminar.')] },
        { label: 'Text a friend in the industry to vent', cost: 1, effects: { ns: 1 },
          result: [nar('They send back a meme and a job posting. Both help.')] },
      ],
    },

    /* ---------- Week 1 · Career fair prep ---------- */
    {
      id: 'l1_fair_prep', title: 'The career fair list', weeks: [1], npc: 'narrator',
      lines: [
        nar('The career fair company list is out: sixty employers, one afternoon.'),
        me('I can\'t talk to sixty companies. Can I?', 'concerned'),
      ],
      choices: [
        { label: 'Research five companies in depth', cost: 2, effects: { cc: 2, inf: 2, flags: ['fair_research'] },
          result: [nar('Five tabs, five notes, one real question for each. Now you know why {co} hires analysts.')] },
        { label: 'Skim the list on the bus', cost: 1, effects: { cc: 1 },
          result: [nar('You can name most of the logos. You couldn\'t say what most of them do.')] },
        { label: 'Split the research with {c:emily} and swap notes', say: 'You take A–M, I take N–Z?', cost: 1,
          effects: { cc: 2, ns: 1, trust: { emily: 1 } },
          result: [say('emily', 'Deal. My notes will have color coding. Fear them.', 'happy')] },
      ],
    },
    {
      id: 'l1_pitch', title: 'Thirty seconds', weeks: [1], npc: 'emily',
      lines: [
        say('emily', "Quick — you're at the {co} booth. Go. Who are you?"),
        me('Um. Hi. I am… a student?', 'concerned'),
        say('emily', 'Bold opening. Want to practice?', 'happy'),
      ],
      choices: [
        { label: 'Practice your pitch with {c:emily}', say: "Okay, again. From the top.", cost: 1, effects: { inf: 2, trust: { emily: 1 } },
          result: [nar('Round five sounds like a person, not a press release.'), say('emily', 'Hire this one.', 'happy')] },
        { label: 'Write it down and memorize it alone', cost: 1, effects: { cc: 2 },
          result: [nar('Word-perfect. Slightly robotic. Better than "a student?"')] },
        { label: 'Record yourself and cut it in half', cost: 2, effects: { inf: 3, cc: 1 },
          result: [nar('The first take is 74 seconds. The last is 28, and every sentence earns its place.')] },
      ],
    },
    {
      id: 'l1_career_center', title: 'Career center hours', weeks: [1, 2], npc: 'narrator',
      lines: [
        nar('The career center has drop-in advising today. Twenty minutes, one advisor, a line of six.'),
      ],
      choices: [
        { label: 'Get your resume reviewed', cost: 1, effects: { cc: 3 },
          result: [nar('Three bullets get numbers. One bullet gets deleted. Both improvements.')] },
        { label: 'Ask which alumni work in analytics', say: 'Do you know alumni in analytics who like hearing from students?', cost: 1,
          effects: { ns: 3, flags: ['alumni_list'] },
          result: [nar('The advisor prints a list of eight names. One of them is {C:gian}.')] },
        { label: 'Skip the line — your resume is fine', cost: 1, effects: { carry: 1 },
          result: [nar('Your resume is fine. "Fine" is doing a lot of work in that sentence.')] },
      ],
    },
    {
      id: 'l1_group_crunch', title: 'Group project crunch', weeks: [1, 2], npc: 'emily',
      lines: [
        nar("Your decision-analysis group project is due Friday. Tonight is also the career center's alumni panel on analytics careers."),
        say('emily', "Who's staying late to fix the model? Asking for… the whole group.", 'concerned'),
      ],
      choices: [
        { label: 'Stay and fix the model', say: "I'll stay. Let's get it working.", cost: 1, effects: { cc: 4, trust: { emily: 1 }, health: -8 },
          result: [say('emily', 'Lifesaver. The model is beautiful.', 'happy'), nar('The panel recording never gets posted.')] },
        { label: 'Go to the alumni panel', say: "I'm going to the panel — I'll check in after.", cost: 1,
          effects: { ns: 4, trust: { gian: 1 }, flags: ['went_panel'] },
          result: [
            nar('One panelist, {c:gian}, runs product experiments for a living. You ask one question.'),
            say('gian', 'Good question. Most people ask about salary.', 'happy'),
            nar('Your group chat is… quieter.'),
          ] },
        { label: 'Try to do both', cost: 2, effects: { cc: 3, ns: 3, health: -6 },
          result: [nar('You catch the last twenty minutes of the panel and push a half-tested fix at 1 a.m. Nobody is mad. Nobody is dazzled.')] },
      ],
    },
    {
      id: 'l1_emily_resume', title: 'A favor at 9 p.m.', weeks: [1, 2], npc: 'emily',
      lines: [
        say('emily', 'Applications close at midnight and my resume reads like a grocery list. Ten minutes?', 'concerned'),
        nar('It will not be ten minutes.'),
      ],
      choices: [
        { label: 'Help her properly', say: "Pull up a chair. Let's do it right.", cost: 2,
          effects: { ns: 2, trust: { emily: 2 }, flags: ['helped_emily'], helped: ['emily'], health: -3 },
          result: [nar('Forty minutes later her bullets have numbers in them.'), say('emily', "I owe you one. I'm writing it on a sticky note so I don't forget.", 'happy')] },
        { label: 'Quick skim, two suggestions', say: "Quick skim — here are the two things I'd fix.", cost: 1,
          effects: { ns: 1, trust: { emily: 1 } },
          result: [say('emily', 'Ooh. Taking the first one.')] },
        { label: "Say you're finishing your own applications", say: "Sorry — I'm buried in my own applications tonight.", cost: 1,
          effects: { cc: 3, flags: ['declined_emily'] },
          result: [nar('Your cover letter gets sharper.'), say('emily', 'No worries.', 'concerned'), nar('It is the tone that means a few worries.')] },
      ],
    },
    {
      id: 'l1_recruiter_post', title: 'A recruiter post appears', weeks: [1, 2, 3], npc: 'molly',
      lines: [
        nar('{c:molly}, a recruiter at {co}, posts that her team is hiring entry-level analysts.'),
        say('molly', "We're hiring analysts! Questions welcome below.", 'happy'),
        nar('The comments are filling up with "Interested!"'),
      ],
      choices: [
        { label: 'Leave a specific, thoughtful comment', say: 'How does your team use experiments in planning?', cost: 1,
          effects: { ns: 2, inf: 2, trust: { molly: 1 }, flags: ['commented_molly'] },
          result: [say('molly', "Great question — that's literally the job.", 'happy')] },
        { label: 'Apply right away, no tailoring', cost: 1, effects: { cc: 1, flags: ['applied_northwind'] },
          result: [nar('Submitted in four minutes. Your application joins a pile of four hundred. (In-game only — your real applications are logged separately.)')] },
        { label: 'Tailor your resume first', cost: 2, effects: { cc: 3, trust: { molly: 1 }, flags: ['tailored_northwind', 'applied_northwind'] },
          result: [nar('It takes an evening. The resume now sounds like it was written for this job, because it was.')] },
      ],
    },
    {
      id: 'l1_gian_post', title: 'An alum posts an article', weeks: [1, 2, 3], npc: 'gian',
      lines: [
        nar('{c:gian}, an alum in product analytics, posts an article about how his team runs product experiments.'),
        nar('It has 14 likes.'),
      ],
      choices: [
        { label: 'Reply with a specific thought from a class project', say: 'We hit the same sample-size problem in class — how did you handle it?', cost: 1,
          effects: { ns: 1, inf: 1, trust: { gian: 1 }, flags: ['replied_gian'] },
          result: [say('gian', 'Ha — we made exactly that mistake last quarter. Short answer: we waited.', 'happy')] },
        { label: 'Like it and move on', cost: 1, effects: { cc: 1 },
          result: [nar("A like is not networking. (In the real missions, it wouldn't count either.)")] },
        { label: 'Forward it to {c:emily}', cost: 1, effects: { trust: { emily: 1 } },
          result: [say('emily', 'ooh', 'happy'), nar('That is the whole reply. Friendship.')] },
      ],
    },

    /* ---------- Week 2 · Alumni outreach ---------- */
    {
      id: 'l1_alumni_directory', title: 'Three hundred alumni', weeks: [2], npc: 'narrator',
      lines: [
        nar('The alumni directory has three hundred people with "analyst" in their title.'),
        me('Where do I even start?', 'concerned'),
      ],
      choices: [
        { label: 'Pick five whose paths match yours and research each', cost: 2, effects: { ns: 2, inf: 2 },
          result: [nar('Five names, five reasons. Each message you write this week will start with "I noticed you…"')] },
        { label: 'Export all three hundred into a spreadsheet', cost: 1, effects: { ns: 1 },
          result: [nar('A beautiful spreadsheet. Zero conversations.')] },
        { label: "Ask {c:gian} who he'd talk to in your shoes", say: "If you were me, who would you reach out to first?", cost: 1,
          requires: { any: [{ flag: 'went_panel' }, { flag: 'replied_gian' }, { trustGte: ['gian', 1] }] },
          lockedHint: "You haven't connected with {c:gian} yet.",
          effects: { ns: 3, trust: { gian: 1 } },
          result: [say('gian', "Talk to people two or three years ahead of you. They remember exactly what you're going through.", 'happy')] },
      ],
    },
    {
      id: 'l1_subject_line', title: 'The subject line debate', weeks: [2], npc: 'emily',
      lines: [
        say('emily', 'Settle this. Subject line: "Quick question" or something specific?'),
        me('Specific. Probably. Maybe.'),
      ],
      choices: [
        { label: "Go specific: mention their team's work", say: "Specific. If I can't say why them, why would they reply?", cost: 1, effects: { inf: 3 },
          result: [say('emily', 'Fine. You win. Again.', 'concerned'), nar('Your reply rate this week is noticeably better.')] },
        { label: 'Go generic and send more', cost: 1, effects: { ns: 1 },
          result: [nar('Twelve sent, one reply, and that one asks what the question is.')] },
        { label: 'Test both and compare replies with {c:emily}', say: 'Let\'s test it. You send generic, I send specific.', cost: 2,
          effects: { cc: 2, inf: 1, trust: { emily: 1 } },
          result: [say('emily', 'A field experiment. The professor would be proud.', 'happy')] },
      ],
    },
    {
      id: 'l1_early_call', title: 'Free tomorrow at 8?', weeks: [2, 3], npc: 'narrator',
      lines: [
        nar('An alum replies at 11 p.m.: "Free tomorrow at 8 a.m.? Otherwise it\'ll be a few weeks."'),
        nar('You have class at 8:30.'),
      ],
      choices: [
        { label: 'Take the call and run to class', cost: 2, effects: { ns: 3, inf: 1, health: -3 },
          result: [nar('Twenty-two minutes of real advice, eight minutes of sprinting. Worth it.')] },
        { label: 'Thank them and propose two other times', say: 'Thanks so much! Would Thursday at noon or Friday at 4 work instead?', cost: 1, effects: { ns: 1, inf: 1 },
          result: [nar('They pick Friday. A clear, polite counteroffer is still a yes.')] },
        { label: 'Let it slide', cost: 1, effects: { cc: 1 },
          result: [nar('By the time you reply, "a few weeks" has become "next quarter."')] },
      ],
    },
    {
      id: 'l1_silence', title: 'No replies', weeks: [2, 3], npc: 'narrator',
      lines: [
        nar('Last week you sent three outreach messages. Nobody has replied.'),
        me('Is my inbox broken?', 'concerned'),
        nar('Your inbox has the emotional range of a parking lot.'),
      ],
      choices: [
        { label: 'Send one polite follow-up', cost: 1, effects: { ns: 2, inf: 1 },
          result: [nar('One reply arrives: "Sorry, buried in launches. Thursday?" Silence is often just a busy calendar.')] },
        { label: 'Let it go and focus on coursework', cost: 1, effects: { cc: 2 },
          result: [nar('Your problem set is excellent. Your inbox is unchanged.')] },
        { label: 'Ask {c:mercer} how to write better outreach', say: 'Could I show you an outreach message that got no replies?', cost: 1,
          effects: { inf: 2, trust: { mercer: 1 }, flags: ['office_hours'] },
          result: [say('mercer', 'Say why you chose this specific person, and ask one question they can answer in two minutes.', 'happy')] },
      ],
    },
    {
      id: 'l1_case_comp', title: 'Case competition', weeks: [2, 3], npc: 'emily',
      lines: [
        say('emily', 'Case competition. You, me, two others.', 'happy'),
        say('emily', 'Prize is bragging rights — and a recruiter on the judging panel.'),
      ],
      choices: [
        { label: 'Join the team', say: "I'm in.", cost: 2, effects: { cc: 2, ns: 2, trust: { emily: 1 }, flags: ['case_team'] },
          result: [nar('You argue about one chart for an hour, then build a better one together. Third place. Excellent story.')] },
        { label: 'Decline — build a solo portfolio project', say: "I'll pass — I want to finish my portfolio project.", cost: 2, effects: { cc: 5 },
          result: [nar('Your portfolio project is impressive. Its audience, for now, is exactly you.')] },
        { label: 'Offer to review their final deck', say: "I can't join, but I'll review your final deck.", cost: 1, effects: { inf: 1, trust: { emily: 1 } },
          result: [nar('You cut eleven slides.'), say('emily', 'We hate you. Thank you.', 'happy')] },
      ],
    },

    /* ---------- Week 3 · Coffee chats ---------- */
    {
      id: 'l1_reschedule', title: 'Something came up', weeks: [3], npc: 'gian',
      lines: [
        say('gian', 'So sorry — launch fire drill. Can we move our coffee?', 'concerned'),
        nar('You had cleared your whole afternoon.'),
      ],
      choices: [
        { label: 'Reply graciously with two new times', say: 'Of course! Would Tuesday at 3 or Wednesday at 10 work?', cost: 1,
          effects: { inf: 2, trust: { gian: 1 } },
          result: [say('gian', 'Tuesday. Thanks for being flexible.', 'happy')] },
        { label: 'Say "no problem" and quietly stew', cost: 1, effects: { cc: 1 },
          result: [nar('You spend the afternoon productively annoyed.')] },
        { label: 'Send new times plus a two-line agenda', say: 'Tuesday at 3? I\'d love to ask about how you chose product analytics, and how you prep for experiment reviews.', cost: 2,
          effects: { inf: 3, trust: { gian: 1 }, flags: ['agenda_sent'] },
          result: [say('gian', 'This is great. I\'ll actually come prepared.', 'happy')] },
      ],
    },
    {
      id: 'l1_thank_you', title: 'After the chat', weeks: [3, 4], npc: 'narrator',
      lines: [nar('You just finished a 20-minute call with an alum. It went well, you think.')],
      choices: [
        { label: 'Send a same-day thank-you with one specific takeaway', cost: 1, effects: { ns: 2, inf: 1 },
          result: [nar('"I\'m going to try your tip about asking for feedback on drafts." They reply with a second tip.')] },
        { label: 'Wait until you have news to share', cost: 1, effects: { ns: 1 },
          result: [nar('A fine plan, if you remember. You set a reminder.')] },
        { label: 'Skip it — they\'re busy', cost: 1, effects: { cc: 1 },
          result: [nar('They are busy. They also would have liked hearing from you.')] },
      ],
    },
    {
      id: 'l1_questions', title: 'What to ask', weeks: [3], npc: 'mercer',
      lines: [
        nar('You pass {c:mercer} in the hallway, holding a list of coffee-chat questions.'),
        say('mercer', 'Preparing for something?', 'happy'),
      ],
      choices: [
        { label: 'Ask him to glance at your question list', say: 'Would you look at my questions for a coffee chat?', cost: 1,
          effects: { inf: 2, trust: { mercer: 1 } },
          result: [say('mercer', 'Ask about a decision they made and how they made it. People remember those conversations.', 'happy')] },
        { label: 'Say hi and keep moving', cost: 1, effects: { cc: 1 },
          result: [nar('Polite. Brief. Your list stays the same.')] },
        { label: 'Ask how he thinks about career decisions', say: 'How do you think about big career choices?', cost: 1,
          effects: { cc: 1, inf: 1, trust: { mercer: 1 } },
          result: [say('mercer', 'Decide what matters before you look at the options. Otherwise the shiniest option decides for you.')] },
      ],
    },
    {
      id: 'l1_mock_interview', title: 'One mock-interview slot', weeks: [3, 4], npc: 'emily',
      lines: [
        nar('The career center has one mock-interview slot left this week.'),
        say('emily', 'Oh no. Were you going to take that slot? I wanted it too.', 'concerned'),
      ],
      choices: [
        { label: 'Take the slot', cost: 1, effects: { cc: 3, inf: 1 },
          result: [nar('The coach says you sound confident and say "basically" too much. Both true.')] },
        { label: 'Give it to {c:emily}', say: "Take it. You've got the earlier interview.", cost: 1, effects: { trust: { emily: 2 }, flags: ['gave_slot'], helped: ['emily'] },
          result: [say('emily', 'Seriously? Thank you.', 'happy'), nar('She brings you a coffee the next day.')] },
        { label: 'Practice alone with flashcards', cost: 1, effects: { cc: 2 },
          result: [nar('The flashcards never interrupt. That is also the problem.')] },
      ],
    },

    /* ---------- Week 4 · Interviews ---------- */
    {
      id: 'l1_case_drill', title: 'Case drills', weeks: [4], npc: 'emily',
      lines: [
        say('emily', 'I found twelve analytics cases. We could split them.'),
        me('Or I could do all twelve tonight.', 'concerned'),
      ],
      choices: [
        { label: 'Timed drills alone', cost: 2, effects: { cc: 4 },
          result: [nar('Twelve cases. Your cohort analysis is now muscle memory.')] },
        { label: 'Trade cases with {c:emily}', say: "Let's swap — you interview me, I interview you.", cost: 1, effects: { cc: 2, trust: { emily: 1 } },
          result: [say('emily', 'You pause before every answer. Keep doing that — it sounds thoughtful.', 'happy')] },
        { label: 'Explain your logic out loud to someone non-technical', cost: 1, effects: { inf: 3, cc: 1 },
          result: [nar("Your roommate asks \"why does that matter?\" four times. Each answer gets clearer.")] },
      ],
    },
    {
      id: 'l1_schedule_clash', title: 'Schedule clash', weeks: [4], npc: 'molly',
      lines: [
        say('molly', 'We can do your second round Thursday at 2. Does that work?'),
        nar('Thursday at 2 is your exam review session.'),
      ],
      choices: [
        { label: 'Politely ask for another slot', say: "I have an exam review then — could Friday morning work?", cost: 1, effects: { inf: 2, trust: { molly: 1 } },
          result: [say('molly', 'Friday at 10. Thanks for telling me early.', 'happy')] },
        { label: 'Take the slot and skip the review', cost: 1, effects: { cc: -1, trust: { molly: 1 } },
          result: [nar('The interview goes fine. The exam review notes are a mystery.')] },
        { label: 'Take the slot and ask {c:emily} for notes', say: 'Emily — could I borrow your review notes Thursday?', cost: 2,
          effects: { ns: 1, trust: { emily: 1, molly: 1 } },
          result: [say('emily', 'Only if you tell me what they asked you.', 'happy')] },
      ],
    },
    {
      id: 'l1_story_bank', title: 'Your story bank', weeks: [4, 5], npc: 'narrator',
      lines: [
        nar('Interviewers will ask for stories. You have a blank page titled "Stories."'),
      ],
      choices: [
        { label: 'Write stories from coursework only', cost: 1, effects: { cc: 3 },
          result: [nar('Five solid stories. All of them start with "In my class project…"')] },
        { label: 'Include times you helped or persuaded someone', cost: 1, effects: { inf: 2, ns: 1 },
          result: [nar('Your best story turns out to be about a disagreement you resolved.')] },
        { label: 'Ask a friend which story sounds most like you', cost: 1, effects: { ns: 2 },
          result: [nar('They pick the one you almost deleted.')] },
      ],
    },

    /* ---------- Week 5 · Offers & decisions ---------- */
    {
      id: 'l1_finalists', title: 'Two finalists', weeks: [5], npc: 'emily',
      lines: [
        say('emily', 'So… I heard {co} is down to two finalists. And I heard one of them is me.'),
        say('emily', 'What did they ask you in round two?', 'concerned'),
      ],
      choices: [
        { label: 'Share what you know', say: 'Mostly trade-offs. Explain your reasoning, not just the math.', cost: 1,
          effects: { ns: 1, trust: { emily: 2 }, helped: ['emily'] },
          result: [say('emily', "Thank you. Whoever gets it, we're getting drinks.", 'happy')] },
        { label: 'Keep it vague', say: 'Oh, the usual stuff.', cost: 1, effects: { cc: 1, trust: { emily: -1 } },
          result: [say('emily', 'Right. The usual.', 'concerned')] },
        { label: 'Share, and ask what she has learned', say: "Trade-offs, mostly. What did you hear about the team?", cost: 1,
          effects: { ns: 2, inf: 1, trust: { emily: 1 } },
          result: [say('emily', "That they're hiring two more next spring. Keep that in your pocket.", 'happy')] },
      ],
    },
    {
      id: 'l1_salary_research', title: 'What is fair?', weeks: [5], npc: 'narrator',
      lines: [
        nar('If an offer comes, you will need to know what a fair number looks like.'),
        me('I have no idea what a fair number is.', 'concerned'),
      ],
      choices: [
        { label: 'Look up public salary data', cost: 1, effects: { cc: 2 },
          result: [nar('A range so wide it includes "intern" and "director."')] },
        { label: 'Ask a recent grad what offers looked like', cost: 1, effects: { ns: 2, inf: 2, flags: ['salary_info'] },
          result: [nar('One honest conversation gives you a tighter range than three websites.')] },
        { label: 'Ask {c:mercer} how to compare offers', say: 'How should I compare offers if I get more than one?', cost: 1,
          effects: { inf: 2, trust: { mercer: 1 } },
          result: [say('mercer', 'Write down your criteria before you see the numbers. Then the numbers have to answer to you.', 'happy')] },
      ],
    },
    {
      id: 'l1_gratitude', title: 'Before the news', weeks: [5], npc: 'narrator',
      lines: [nar('A lot of people helped you get here. None of them know how it turned out yet.')],
      choices: [
        { label: 'Send short thank-you notes to everyone who helped', cost: 2, effects: { ns: 3, trust: { gian: 1, mercer: 1 } },
          result: [nar('Six notes. Four replies. One of them: "Keep me posted — I\'m rooting for you."')] },
        { label: 'Thank only people who might hire you', cost: 1, effects: { inf: 1 },
          result: [nar('Efficient. People can usually tell.')] },
        { label: 'Wait until you have news', cost: 1, effects: { cc: 1 },
          result: [nar('Reasonable. You set a reminder you may or may not see.')] },
      ],
    },
  ],

  2: [
    /* ---------- General (any week) ---------- */
    {
      id: 'l2_standup', title: 'Standup', npc: 'ted',
      lines: [say('ted', "Standup. Let's go around. {p}, what's your status?")],
      choices: [
        { label: 'Crisp update on your dashboard', say: 'Dashboard is 80% done; blocked on one table; demo Friday.', cost: 1, effects: { cc: 2, trust: { ted: 1 } },
          result: [nar('Thirty seconds, no filler.'), say('ted', 'Perfect.', 'happy')] },
        { label: "Flag a dependency on Engineering's pipeline", say: "Heads up: I depend on Engineering's nightly pipeline.", cost: 1, effects: { inf: 2, trust: { shalini: 1 } },
          result: [say('shalini', 'Thanks for raising it early.', 'happy')] },
        { label: "Say you'd like to meet partner teams", say: "I'd love to meet the partner teams who use our data.", cost: 1, effects: { ns: 2, trust: { ted: 1 } },
          result: [say('ted', "Good instinct. I'll send you three names before lunch.", 'happy')] },
      ],
    },
    {
      id: 'l2_allhands', title: 'All-hands', npc: 'narrator',
      lines: [nar('Company all-hands. The CEO opens the floor for questions.'), nar('Two hundred people suddenly find their shoes very interesting.')],
      choices: [
        { label: 'Ask a question about data strategy', cost: 1, effects: { inf: 3 },
          result: [nar('Your question gets a real answer, and two people message you afterward.')] },
        { label: 'Take notes', cost: 1, effects: { cc: 1 },
          result: [nar('Very good notes. Nobody will ever see them.')] },
        { label: "Message {c:jihee} about her team's launch afterward", say: 'Congrats on the launch — the demo was great.', cost: 1, effects: { ns: 2, trust: { jihee: 1 } },
          result: [say('jihee', 'Someone outside Marketing noticed! Thank you.', 'happy')] },
      ],
    },

    /* ---------- Week 1 · Onboarding ---------- */
    {
      id: 'l2_access', title: 'Access denied', weeks: [1], npc: 'shalini',
      lines: [
        nar('Your database access request has been "pending" for three days.'),
        me('I can read about the data. I just can\'t see any of it.', 'concerned'),
      ],
      choices: [
        { label: 'File another ticket and wait', cost: 1, effects: { cc: 1 },
          result: [nar('Ticket #4471 joins ticket #4398 in the queue.')] },
        { label: 'Ask {c:shalini} which group approves it', say: 'Sorry to bother you — do you know who approves warehouse access?', cost: 1,
          effects: { ns: 2, trust: { shalini: 1 } },
          result: [say('shalini', 'Me, actually. Approved. Welcome aboard.', 'happy')] },
        { label: 'Pair with a teammate on their laptop meanwhile', cost: 2, effects: { cc: 2, ns: 1 },
          result: [nar('You learn where the bodies are buried — in the schema, specifically.')] },
      ],
    },
    {
      id: 'l2_first_intros', title: 'Who should you know?', weeks: [1], npc: 'ted',
      lines: [
        say('ted', 'Your onboarding buddy is out this week. Sorry about that.', 'concerned'),
        say('ted', 'You may have to meet people the old-fashioned way.'),
      ],
      choices: [
        { label: 'Book 15-minute intros with one person per team', cost: 2, effects: { ns: 3, trust: { ben: 1, jihee: 1 } },
          result: [nar('Four calendar invites. Four "sure!"s. People like being asked about their work.')] },
        { label: 'Read the wiki instead', cost: 1, effects: { cc: 2 },
          result: [nar('The wiki was last updated by someone who left in 2021.')] },
        { label: 'Ask {c:ted} who you should meet first', say: 'Who would you meet first, if you were me?', cost: 1, effects: { ns: 1, trust: { ted: 1 } },
          result: [say('ted', 'Ben in Finance. He knows where every number comes from.', 'happy')] },
      ],
    },
    {
      id: 'l2_metric_doc', title: 'Undocumented metrics', weeks: [1, 2], npc: 'ben',
      lines: [
        nar('Nobody can tell you exactly how "active customer" is defined.'),
        say('ben', "Finance has a definition. It's in a spreadsheet. Somewhere."),
      ],
      choices: [
        { label: 'Write a shared glossary and post it', cost: 2, effects: { cc: 1, inf: 2 },
          result: [nar('Three teams correct it within an hour. Now it is right — and they helped write it.')] },
        { label: 'Keep your own notes privately', cost: 1, effects: { cc: 2 },
          result: [nar('Your notes are excellent. Everyone else is still confused.')] },
        { label: 'Ask {c:ben} to review your definitions', say: 'Would you check my definitions against Finance\'s?', cost: 1, effects: { ns: 1, trust: { ben: 1 } },
          result: [say('ben', 'Two are wrong. The rest are less wrong than ours.', 'happy')] },
      ],
    },
    {
      id: 'l2_lunch', title: 'Lunch invite', weeks: [1, 2], npc: 'jihee',
      lines: [
        say('jihee', 'Marketing is heading to lunch — want to come?', 'happy'),
        nar('You have a half-finished query open.'),
      ],
      choices: [
        { label: 'Join them', say: "I'd love to.", cost: 1, effects: { ns: 3, trust: { jihee: 1 } },
          result: [say('jihee', "We've been asking for a churn view for months. Nobody told Analytics?", 'concerned')] },
        { label: 'Eat at your desk and finish', cost: 1, effects: { cc: 3 },
          result: [nar('The query runs. The sandwich is fine.')] },
        { label: 'Catch them for coffee afterward', say: 'Can I catch you for coffee after?', cost: 1, effects: { ns: 2 },
          result: [nar("Fifteen minutes, three names, one inside joke you don't get yet.")] },
      ],
    },
    {
      id: 'l2_ticket', title: 'An urgent request', weeks: [1, 2], npc: 'ben',
      lines: [
        say('ben', 'Quick one — can you pull Q3 revenue by region? Need it in an hour.', 'concerned'),
        nar('It is not in your queue.'),
      ],
      choices: [
        { label: 'Help now, carefully', say: "I'll have it to you in 50 minutes.", cost: 2, effects: { cc: 1, trust: { ben: 2 }, flags: ['l2_helped_ben'], helped: ['ben'] },
          result: [say('ben', "You're my new favorite analyst.", 'happy'), nar('He has met two.')] },
        { label: 'Route it to {c:ted}', say: "Let me check with Ted on priority first.", cost: 1, effects: { trust: { ted: 1 } },
          result: [nar('{c:ted} appreciates the process.'), say('ben', 'Great. Process.', 'concerned')] },
        { label: 'Do a quick rough pull', cost: 1, effects: { cc: -1, trust: { ben: 1 } },
          result: [nar('Fast — and one region is double-counted.'), say('ben', 'Is Texas twice as big as last week?', 'concerned')] },
      ],
    },
    {
      id: 'l2_outage', title: 'Pipeline outage', weeks: [1, 2, 3], npc: 'shalini',
      lines: [
        say('shalini', 'Pipeline broke overnight. Three dashboards are stale. Looking into it.', 'concerned'),
      ],
      choices: [
        { label: 'Offer to help validate the fix', say: 'Want a second pair of eyes on the backfill?', cost: 2,
          effects: { cc: 1, trust: { shalini: 2 }, flags: ['l2_helped_shalini'], helped: ['shalini'], health: -4 },
          result: [nar('You catch a timezone bug in the backfill.'), say('shalini', "I'm adding you to the incident channel. For next time.", 'happy')] },
        { label: 'Wait for the all-clear', cost: 1, effects: { cc: 2 },
          result: [nar('You get real work done. The dashboards come back eventually.')] },
        { label: 'React with 👀 and move on', cost: 1, effects: {},
          result: [nar('Emoji support is not support.')] },
      ],
    },

    /* ---------- Week 2 · Stakeholder discovery ---------- */
    {
      id: 'l2_shadow', title: 'Sit in on Marketing', weeks: [2], npc: 'jihee',
      lines: [
        say('jihee', "We're reviewing campaign results at 2. Want to sit in and see how we actually use your numbers?"),
      ],
      choices: [
        { label: 'Shadow the meeting', say: "Yes — I'll stay quiet and take notes.", cost: 1, effects: { ns: 2, trust: { jihee: 1 } },
          result: [nar('They make three decisions from one chart. You now know which chart matters.')] },
        { label: 'Skip it — your calendar is full', cost: 1, effects: { cc: 2 },
          result: [nar('You finish your tickets. You still do not know how anyone uses them.')] },
        { label: 'Shadow, then send one chart that would have helped', cost: 2, effects: { inf: 2, trust: { jihee: 2 } },
          result: [say('jihee', 'Can you make this a weekly thing?', 'happy')] },
      ],
    },
    {
      id: 'l2_survey', title: 'Listening at scale', weeks: [2, 3], npc: 'narrator',
      lines: [nar('You want to know what partner teams need from the dashboard.'), me('Survey, or actually talk to people?')],
      choices: [
        { label: 'Send a three-question survey', cost: 1, effects: { ns: 1, inf: 1 },
          result: [nar('Seven responses. Four say "looks good!"')] },
        { label: 'Do three quick interviews instead', cost: 2, effects: { ns: 3, trust: { ben: 1, jihee: 1 } },
          result: [nar('Every interview surfaces something no survey would have.')] },
        { label: 'Skip it and trust your instincts', cost: 1, effects: { cc: 2 },
          result: [nar('Your instincts are good. They are also only yours.')] },
      ],
    },
    {
      id: 'l2_solo', title: 'A visible project', weeks: [2, 3], npc: 'ted',
      lines: [say('ted', 'Leadership wants a pricing analysis. Visible project. Want it?')],
      choices: [
        { label: 'Take it solo', say: "I'll take it.", cost: 2, effects: { cc: 5 },
          result: [nar('Strong work, your name on it. Also: you, alone, on a Saturday.')] },
        { label: 'Take it and invite {c:jihee} to co-own it', say: "Yes — and I'd like to bring in Jihee from Marketing.", cost: 2,
          effects: { cc: 2, inf: 2, trust: { jihee: 1 }, flags: ['l2_coowned'] },
          result: [say('ted', 'Less credit each. More people invested in it working.'), nar('That trade-off shows up later.')] },
        { label: "Pass — you're at capacity", say: "I'm at capacity — I'd do it badly right now.", cost: 1, effects: { carry: 1 },
          result: [say('ted', 'I respect the honesty. Somewhat.', 'concerned')] },
      ],
    },

    /* ---------- Week 3 · Shared project ---------- */
    {
      id: 'l2_scope_creep', title: 'One more thing', weeks: [3], npc: 'jihee',
      lines: [
        say('jihee', 'Could the dashboard also show campaign attribution? Just one more tab.', 'happy'),
        nar('"Just one more tab" is three weeks of work.'),
      ],
      choices: [
        { label: 'Say yes', say: 'Sure, I can add it.', cost: 1, effects: { cc: -1, trust: { jihee: 1 } },
          result: [nar('She is delighted. Your weekend is not.')] },
        { label: 'Trade: add it in phase two, if she helps define it', say: 'Phase two — if you help me define what "attributed" means.', cost: 1,
          effects: { inf: 2, trust: { jihee: 1 } },
          result: [say('jihee', 'Deal. I have opinions about attribution.', 'happy')] },
        { label: 'Say no — it is out of scope', cost: 1, effects: { cc: 1, trust: { jihee: -1 } },
          result: [say('jihee', 'Oh. Okay.', 'concerned')] },
      ],
    },
    {
      id: 'l2_credit', title: 'Public praise', weeks: [3, 4], npc: 'ted',
      lines: [say('ted', 'Shout-out in the team channel: great work on the retention dashboard, {p}!', 'happy'), nar('Three teams built it with you.')],
      choices: [
        { label: 'Name your partners publicly', say: 'Thanks! Ben, Jihee and Shalini made this possible.', cost: 1,
          effects: { inf: 2, trust: { ben: 1, jihee: 1, shalini: 1 } },
          result: [nar('Three people react with 🙌. Credit shared is credit that comes back.')] },
        { label: 'Accept the credit', say: 'Thank you!', cost: 1, effects: { cc: 2 },
          result: [nar('It feels great. Someone in Engineering notices their name is missing.')] },
        { label: 'Thank {c:ted} privately', cost: 1, effects: { trust: { ted: 1 } },
          result: [say('ted', 'You earned it.', 'happy')] },
      ],
    },
    {
      id: 'l2_metric_fight', title: 'Two definitions', weeks: [3, 4], npc: 'ben',
      lines: [
        say('ben', 'Revenue at risk should use contract value.', 'concerned'),
        nar('{c:jihee}, in the same thread, insists it should use monthly usage.'),
      ],
      choices: [
        { label: "Pick Finance's definition", cost: 1, effects: { cc: 1, trust: { ben: 1, jihee: -1 } },
          result: [nar('Settled — in the way that leaves one person unsettled.')] },
        { label: 'Run a 20-minute alignment call', say: "Let's get on a call and pick one together.", cost: 2,
          effects: { inf: 3, trust: { ben: 1, jihee: 1 } },
          result: [nar('They agree on contract value, with usage as a warning flag. Both feel heard.')] },
        { label: 'Stay out of it', cost: 1, effects: { cc: 1 },
          result: [nar('The thread grows to 46 messages.')] },
      ],
    },

    /* ---------- Week 4 · Building support ---------- */
    {
      id: 'l2_elevator', title: 'Elevator', weeks: [4, 5], npc: 'narrator',
      lines: [nar('You step into the elevator. The CFO is already in it.'), nar('Eleven floors.')],
      choices: [
        { label: 'Give a 20-second version of your proposal', cost: 1, effects: { inf: 3 },
          result: [nar('"Send me the one-pager," the CFO says, stepping out. You have a one-pager. Right?')] },
        { label: 'Make small talk', cost: 1, effects: { ns: 1 },
          result: [nar('You both agree the weather is weather.')] },
        { label: 'Look at your phone', cost: 1, effects: {},
          result: [nar('Eleven very long floors.')] },
      ],
    },
    {
      id: 'l2_deck_review', title: 'Red pen', weeks: [4], npc: 'ted',
      lines: [say('ted', 'I marked up your deck. Some of these you will disagree with.')],
      choices: [
        { label: 'Accept every edit', cost: 1, effects: { cc: 2, trust: { ted: 1 } },
          result: [nar('The deck is now very much {c:ted}\'s deck.')] },
        { label: 'Push back on one edit, with data', say: 'I\'d keep slide 4 — here\'s why the cohort view matters.', cost: 1, effects: { inf: 2, cc: 1 },
          result: [say('ted', 'Fair. Keep it.', 'happy')] },
        { label: 'Ask who the toughest audience will be', say: 'Who in that room is hardest to convince?', cost: 1, effects: { inf: 1, ns: 1, trust: { ted: 1 } },
          result: [say('ted', 'The CFO. She will ask about cost. Ben will know the answer.')] },
      ],
    },
    {
      id: 'l2_maintenance', title: 'Who maintains it?', weeks: [4], npc: 'shalini',
      lines: [say('shalini', "If this becomes the company standard, who's on call when it breaks at 2 a.m.?", 'concerned')],
      choices: [
        { label: 'Promise you will handle it', say: "I'll handle it.", cost: 1, effects: { trust: { shalini: 1 }, cc: -1 },
          result: [nar('A generous promise. Your future self files a complaint.')] },
        { label: 'Co-design an on-call plan with her team', say: "Let's design it together so it isn't on one person.", cost: 2,
          effects: { inf: 2, trust: { shalini: 2 }, helped: ['shalini'] },
          result: [say('shalini', "Now I can say yes to this in the review.", 'happy')] },
        { label: "Say it's an Engineering problem", cost: 1, effects: { cc: 1, trust: { shalini: -1 } },
          result: [say('shalini', 'Noted.', 'concerned')] },
      ],
    },

    /* ---------- Week 5 · Presentation week ---------- */
    {
      id: 'l2_dry_run', title: 'Dry run', weeks: [5], npc: 'ted',
      lines: [say('ted', 'Presentation is Friday. Want to do a dry run?')],
      choices: [
        { label: 'Rehearse alone', cost: 1, effects: { cc: 3 },
          result: [nar('You know every slide by heart. The questions, not so much.')] },
        { label: 'Dry run with partners from each team', cost: 2, effects: { inf: 2, ns: 1, trust: { ben: 1, jihee: 1, shalini: 1 } },
          result: [nar('They ask the hard questions now, so leadership can\'t surprise you later.')] },
        { label: "Ask {c:ted} for the toughest question he'd ask", say: "What's the hardest question you'd ask me?", cost: 1, effects: { inf: 1, trust: { ted: 1 } },
          result: [say('ted', '"Why should every team switch?" Have an answer that isn\'t yours alone.')] },
      ],
    },
    {
      id: 'l2_data_bug', title: 'A bug, the day before', weeks: [5], npc: 'shalini',
      lines: [nar('The day before the presentation, you find a bug: one week of data is duplicated.'), me('Of course. Of course it is.', 'concerned')],
      choices: [
        { label: 'Fix it quietly', cost: 1, effects: { cc: 2 },
          result: [nar('Fixed. Nobody knows. Nobody knows you are careful, either.')] },
        { label: 'Fix it and tell partners right away', cost: 2, effects: { inf: 2, trust: { ben: 1, jihee: 1, shalini: 1 } },
          result: [nar('"Thanks for flagging before the meeting." Honesty early reads as reliability.')] },
        { label: 'Ask {c:shalini} to double-check the fix', say: 'Could you sanity-check my fix?', cost: 1, effects: { cc: 1, trust: { shalini: 1 } },
          result: [say('shalini', 'Fix looks right. Good catch.', 'happy')] },
      ],
    },
    {
      id: 'l2_night_before', title: 'The night before', weeks: [5], npc: 'narrator',
      lines: [nar("It's the night before the leadership review."), me('I should sleep. I should also rewrite everything.', 'concerned')],
      choices: [
        { label: 'Sleep', cost: 1, effects: { carry: 1, health: 8 },
          result: [nar('You wake up rested. The slides did not change overnight, and that is fine.')] },
        { label: 'Rewrite the opening', cost: 1, effects: { cc: 2, health: -6 },
          result: [nar('The new opening is better. It is also 1 a.m.')] },
        { label: 'Text an ally for a pep talk', cost: 1, effects: { ns: 1 },
          result: [nar('"You\'ve got this. Also I\'ll be in the second row nodding."')] },
      ],
    },
  ],
  3: [
    /* ---------- General (any week) ---------- */
    {
      id: 'l3_standup', title: 'Team standup', npc: 'ray',
      lines: [nar('Your first standup as the person running it. Three faces look at you.'), say('ray', 'So… do we go in order, or do you want status reports now?')],
      choices: [
        { label: 'Keep it to blockers only, 10 minutes max', tag: 'team', say: "Just blockers. If you're not blocked, say so and get back to work.", cost: 1, effects: { morale: 3, cc: 1 },
          result: [say('ray', 'Huh. Short meetings. I can work with that.', 'happy')] },
        { label: 'Ask for detailed status on every task', tag: 'might', say: 'Let\'s go task by task so I know where everything stands.', cost: 1, effects: { cc: 2, morale: -4 },
          result: [nar('Forty minutes later, you know everything. Your team knows you didn\'t trust them to tell you.')] },
        { label: 'Ask each person what would make this week easier', tag: 'allocentrism', cost: 2, effects: { morale: 5, trust: { ashley: 1 } },
          result: [say('ashley', 'Honestly? Fewer meetings on Thursdays.', 'happy'), nar('An easy fix. You make it.')] },
      ],
    },
    {
      id: 'l3_lateslack', title: '10 p.m. message', npc: 'naveen', late: true,
      lines: [nar('10 p.m. A message from Teresa: "Can your team get me the Q3 numbers by 8 a.m.?"')],
      choices: [
        { label: 'Do it yourself tonight', cost: 2, effects: { cc: 3, pc: 3, health: -10 },
          result: [nar('You finish at 1 a.m. Teresa says thanks. Your body does not.')] },
        { label: 'Message Naveen to handle it first thing', tag: 'might', cost: 1, effects: { pc: 3, morale: -5, trust: { naveen: -1 } },
          result: [say('naveen', 'Sure. Got it at 6 a.m. Again.', 'concerned')] },
        { label: 'Reply: "You\'ll have it by 11 — here\'s why that\'s better"', tag: 'persuasion', cost: 1, effects: { pc: -1, morale: 3, health: 2 },
          result: [nar('Teresa replies: "11 is fine." Most deadlines are softer than they look at 10 p.m.')] },
      ],
    },
    {
      id: 'l3_allhands', title: 'Managers\' meeting', npc: 'teresa',
      lines: [nar('The monthly managers\' meeting. Teresa asks each manager for one win and one risk.')],
      choices: [
        { label: 'Share a win your team earned, by name', tag: 'team', cost: 1, effects: { morale: 4, pc: 2 },
          result: [nar('Word gets back to your team that you credited them in a room they weren\'t in.')] },
        { label: 'Share your own biggest win', tag: 'ethos', cost: 1, effects: { pc: 4, morale: -2 },
          result: [nar('It lands well with Teresa. Ray hears about it later and says nothing.')] },
        { label: 'Name a risk honestly and ask for help', tag: 'coalitions', cost: 2, effects: { pc: 2, ns: 2, trust: { emily: 1 } },
          result: [say('emily', 'We had the same problem. Coffee tomorrow?', 'happy')] },
      ],
    },

    /* ---------- Week-themed ---------- */
    {
      id: 'l3_first_one_on_one', title: 'First one-on-one', npc: 'ashley', weeks: [1, 2],
      lines: [say('ashley', 'Is this a performance thing? Did I do something wrong?', 'concerned'), nar('It\'s just a one-on-one. She doesn\'t know that yet.')],
      choices: [
        { label: 'Explain this is her time, not yours, and ask what\'s on her mind', tag: 'allocentrism', cost: 2, effects: { morale: 5, trust: { ashley: 2 } },
          result: [say('ashley', 'Oh. Okay. Then… can I ask about how the forecast model works?', 'happy')] },
        { label: 'Use the time to review her task list', tag: 'might', cost: 1, effects: { cc: 2, morale: -2 },
          result: [nar('Efficient. She leaves still not sure what one-on-ones are for.')] },
        { label: 'Share a mistake you made in your first month', tag: 'team', cost: 1, effects: { morale: 3, trust: { ashley: 1 } },
          result: [nar('She laughs for the first time all week.')] },
      ],
    },
    {
      id: 'l3_ray_pushback', title: '"We tried that in 2019"', npc: 'ray', weeks: [1, 2],
      lines: [say('ray', 'This new dashboard idea — we tried it in 2019. It died in a month.')],
      choices: [
        { label: 'Ask him what killed it last time', tag: 'allocentrism', cost: 2, effects: { trust: { ray: 2 }, cc: 2, morale: 3 },
          result: [say('ray', 'Nobody asked Sales. That\'s what killed it.'), nar('Fifteen years of history, available for the price of one question.')] },
        { label: 'Show him the data on why now is different', tag: 'persuasion', cost: 1, effects: { inf: 2, trust: { ray: 1 } },
          result: [say('ray', 'Fine. The numbers are better than 2019. I\'ll give it a shot.')] },
        { label: '"It\'s happening. I need you on board."', tag: 'might', cost: 1, effects: { cc: 2, trust: { ray: -2 }, morale: -3 },
          result: [say('ray', 'You\'re the boss.'), nar('He says it the way people say it when they mean the opposite.')] },
      ],
    },
    {
      id: 'l3_skip_level', title: 'Teresa\'s calendar invite', npc: 'teresa', weeks: [1, 2],
      lines: [say('teresa', 'Fifteen minutes. How\'s the team, really?')],
      choices: [
        { label: 'Give an honest picture, including Naveen\'s flight risk', tag: 'ethos', cost: 1, effects: { pc: 3, inf: 2 },
          result: [say('teresa', 'Thank you for telling me early. Let\'s think about how to keep him.')] },
        { label: 'Say everything is great', cost: 1, effects: { pc: -2 },
          result: [nar('Teresa nods. She has heard "everything is great" from every new manager. It is never true.')] },
        { label: 'Ask what she wishes new managers did more of', tag: 'allocentrism', cost: 2, effects: { pc: 4, ns: 1 },
          result: [say('teresa', 'Bring me problems before they\'re crises. And bring options.', 'happy')] },
      ],
    },
    {
      id: 'l3_recruiter', title: 'Naveen\'s LinkedIn', npc: 'naveen', weeks: [2, 3],
      lines: [nar('Naveen updated his profile last night. "Open to opportunities."'), say('naveen', 'Oh — you saw that. It\'s not personal.', 'concerned')],
      choices: [
        { label: 'Ask what would make staying worth it', tag: 'allocentrism', cost: 2, effects: { trust: { naveen: 2 }, morale: 3, flags: ['l3_naveen_path'] },
          result: [say('naveen', 'Honestly? Leading something. Not just maintaining models.', 'happy'), nar('Now you know what he needs.')] },
        { label: 'Remind him his bonus vests in six months', tag: 'might', cost: 1, effects: { trust: { naveen: -1 }, cc: 1 },
          result: [say('naveen', 'Right. The bonus.'), nar('Money buys time. It rarely buys loyalty.')] },
        { label: 'Say nothing and hope it passes', cost: 1, effects: {},
          result: [nar('It does not pass.')] },
      ],
    },
    {
      id: 'l3_retro', title: 'Team retro', npc: 'ray', weeks: [2, 3],
      lines: [nar('First team retrospective. You ask: what should we stop, start, and keep?'), nar('Silence. Then Ray clears his throat.')],
      choices: [
        { label: 'Thank Ray for going first and act on one item today', tag: 'team', cost: 2, effects: { morale: 6, trust: { ray: 1 } },
          result: [nar('You cancel the redundant Thursday report that afternoon. Next retro, everyone talks.')] },
        { label: 'Share your own list of what the team should change', tag: 'might', cost: 1, effects: { cc: 2, morale: -4 },
          result: [nar('It\'s a good list. It was supposed to be their retro.')] },
        { label: 'Use anonymous sticky notes so everyone can be honest', tag: 'allocentrism', cost: 1, effects: { morale: 4, cc: 1 },
          result: [say('ashley', 'I wrote three. Don\'t guess which.', 'happy')] },
      ],
    },
    {
      id: 'l3_ashley_mistake', title: 'The wrong number', npc: 'ashley', weeks: [2, 3],
      lines: [say('ashley', 'I sent the client the wrong number. It was in my report. I\'m so sorry.', 'concerned')],
      choices: [
        { label: 'Fix it together and own it with the client yourself', tag: 'team', cost: 2, effects: { morale: 5, trust: { ashley: 2 }, pc: -2 },
          result: [nar('You call the client. "Our mistake — here\'s the corrected number." Ashley watches how it\'s done.')] },
        { label: 'Ask her to write a correction and add a review step', tag: 'might', cost: 1, effects: { cc: 2, trust: { ashley: -1 } },
          result: [nar('The process is better now. Ashley is quieter in standup for a week.')] },
        { label: 'Ask what made the error easy to make', tag: 'allocentrism', cost: 1, effects: { cc: 2, trust: { ashley: 1 }, morale: 2 },
          result: [say('ashley', 'The column names are the same in two tables.', 'concerned'), nar('A naming problem, not an Ashley problem. You fix the tables.')] },
      ],
    },
    {
      id: 'l3_emily_grab', title: 'Emily\'s request', npc: 'emily', weeks: [3, 4],
      lines: [say('emily', 'Quick ask: can I borrow Naveen for two weeks? My launch is slipping.')],
      choices: [
        { label: 'Offer Naveen for two days, not two weeks', tag: 'coalitions', cost: 2, effects: { trust: { emily: 2 }, ns: 2, morale: -1 },
          result: [say('emily', 'Two days is plenty, honestly. I owe you.', 'happy')] },
        { label: '"No. My team is at capacity."', tag: 'might', cost: 1, effects: { morale: 2, trust: { emily: -1 } },
          result: [say('emily', 'Okay. Noted.'), nar('Peers keep score, even friendly ones.')] },
        { label: 'Ask Naveen if he wants to — it could be his chance to lead', tag: 'allocentrism', cost: 1, effects: { trust: { naveen: 1, emily: 1 }, morale: 2 },
          result: [say('naveen', 'Actually, yes. I\'d like that.', 'happy')] },
      ],
    },
    {
      id: 'l3_crunch', title: 'Thursday crunch', npc: 'ray', weeks: [3, 4], late: true,
      lines: [nar('A client deliverable is due tomorrow. It\'s 6 p.m. and it\'s not done.')],
      choices: [
        { label: 'Stay late with the team and order dinner', tag: 'team', cost: 2, effects: { morale: 4, cc: 3, health: -8 },
          result: [nar('Pizza, music, and a deliverable at 10:40 p.m. Tired, but together.')] },
        { label: 'Tell everyone to stay until it\'s done', tag: 'might', cost: 1, effects: { cc: 4, morale: -6, health: -4 },
          result: [nar('It gets done. Nobody says goodnight.')] },
        { label: 'Call the client and negotiate a noon deadline', tag: 'persuasion', cost: 1, effects: { pc: -1, morale: 4 },
          result: [nar('The client says noon is fine. Your team goes home.')] },
      ],
    },
    {
      id: 'l3_budget_preview', title: 'Budget preview', npc: 'teresa', weeks: [3, 4],
      lines: [say('teresa', 'Planning heads-up: one new headcount for the whole org. Several teams want it.')],
      choices: [
        { label: 'Start drafting a business case tonight', tag: 'persuasion', cost: 1, effects: { cc: 2, pc: 2, health: -3 },
          result: [nar('Two pages. Rough, but real numbers.')] },
        { label: 'Ask Teresa what would make a case convincing to her', tag: 'allocentrism', cost: 1, effects: { pc: 3, inf: 2 },
          result: [say('teresa', 'Show me what breaks if we don\'t hire. Not what\'s nice if we do.')] },
        { label: 'Talk to partner teams who\'d benefit from your hire', tag: 'coalitions', cost: 2, effects: { ns: 3, inf: 2 },
          result: [nar('Two teams say they\'d support it — if asked.')] },
      ],
    },
    {
      id: 'l3_ray_mentor', title: 'Ray\'s offer', npc: 'ray', weeks: [4, 5],
      lines: [say('ray', 'The new hire keeps asking me questions. I don\'t mind. Is that… officially part of my job now?')],
      choices: [
        { label: 'Make it official: Ray becomes the team\'s mentor', tag: 'team', cost: 1, effects: { morale: 5, trust: { ray: 2, ashley: 1 } },
          result: [say('ray', 'Fifteen years and nobody asked me that.', 'happy')] },
        { label: 'Tell him to focus on his own work', tag: 'might', cost: 1, effects: { cc: 2, trust: { ray: -1 } },
          result: [nar('He does. Ashley stops asking.')] },
        { label: 'Ask what kind of recognition matters to him', tag: 'allocentrism', cost: 2, effects: { trust: { ray: 2 }, morale: 3 },
          result: [say('ray', 'Put my name on the onboarding guide. That\'s it.', 'happy')] },
      ],
    },
    {
      id: 'l3_emily_coffee', title: 'Coffee with Emily', npc: 'emily', weeks: [4, 5],
      lines: [say('emily', 'So. We both want the headcount. Want to talk about it like adults?', 'happy')],
      choices: [
        { label: 'Propose a joint request: one shared analyst', tag: 'coalitions', cost: 2, effects: { trust: { emily: 2 }, ns: 2, pc: 2, flags: ['l3_shared_hire'] },
          result: [say('emily', 'Teresa will love that. Fewer fights for her.', 'happy')] },
        { label: 'Make your case and let the best case win', tag: 'persuasion', cost: 1, effects: { inf: 2 },
          result: [say('emily', 'May the best analyst win. Again.', 'happy')] },
        { label: 'Tell her your team needs it more', tag: 'might', cost: 1, effects: { trust: { emily: -1 } },
          result: [nar('She smiles politely and finishes her coffee quickly.')] },
      ],
    },
    {
      id: 'l3_review_prep', title: 'Review prep', npc: 'naveen', weeks: [4, 5],
      lines: [nar('Quarterly review next week. You need a summary of what your team delivered.')],
      choices: [
        { label: 'Ask each person to write their own highlight', tag: 'team', cost: 2, effects: { morale: 4, cc: 2 },
          result: [nar('Their highlights are better than the ones you would have written.')] },
        { label: 'Write it yourself over the weekend', cost: 2, effects: { cc: 3, health: -6 },
          result: [nar('Thorough, polished, and done on Sunday night.')] },
        { label: 'Lead with one number Teresa cares about', tag: 'persuasion', cost: 1, effects: { pc: 3, inf: 1 },
          result: [nar('One slide, one number, one story. Teresa will remember it.')] },
      ],
    },
    {
      id: 'l3_celebration', title: 'Small win', npc: 'ashley', weeks: [5],
      lines: [say('ashley', 'The client emailed — they loved the forecast! Should we… do something?', 'happy')],
      choices: [
        { label: 'Team lunch, your treat', tag: 'team', cost: 1, effects: { morale: 6 },
          result: [nar('Tacos and a toast to Ashley\'s first client win.')] },
        { label: 'Forward the email to Teresa with the team cc\'d', tag: 'ethos', cost: 1, effects: { pc: 3, morale: 2 },
          result: [say('teresa', 'Great work, team.', 'happy')] },
        { label: 'Move straight on to the next deliverable', cost: 1, effects: { cc: 2, morale: -3 },
          result: [nar('Efficient. Nobody mentions the win again.')] },
      ],
    },
  ],
};
