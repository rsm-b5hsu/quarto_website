// What each meter means, how it grows (in the game and in real life), and when you need it.
// Used by the end-of-week review.
export const CAPABILITIES = {
  cc: {
    key: 'careerCapital', name: 'Career Capital', icon: '🛠',
    what: 'Skills and proof of work — what you can actually do.',
    builtBy: 'Solo work: Deliver, studying, polishing, building things yourself.',
    realWorld: 'Courses, portfolio projects, certifications, doing excellent work on your current tasks.',
    need: {
      1: 'When the problem is live and nobody can help: case interviews, technical questions.',
      2: 'When you must ship fast or defend the numbers under pressure.',
      3: 'When your team is stuck and you have to unblock them yourself — and still be credible with leadership.',
    },
  },
  ns: {
    key: 'networkStrength', name: 'Network Strength', icon: '🤝',
    what: 'How many people know you, and how well.',
    builtBy: 'Connect, going to events, following up, helping people before you need them.',
    realWorld: 'Coffee chats, thoughtful follow-ups, alumni outreach, keeping in touch after people help you.',
    need: {
      1: 'When you need an introduction, a referral, or to hear about a job before it is posted.',
      2: 'When the answer is not in any documentation and you need someone who knows.',
      3: 'When you need allies across teams: an early warning, a co-signer, a sponsor in the room.',
    },
  },
  inf: {
    key: 'influence', name: 'Influence', icon: '📣',
    what: 'Whether people act on what you say.',
    builtBy: 'Specific questions, giving first, sharing credit, aligning people before a decision.',
    realWorld: 'Asking sharp questions, sharing useful resources, crediting partners, talking to people one-on-one before big meetings.',
    need: {
      1: 'When you ask someone to vouch for you, or negotiate an offer.',
      2: 'When you need leaders to say yes, or a sponsor to back you in the room.',
      3: 'When you compete for budget and headcount, or need your team to follow a hard call.',
    },
  },
};

export const METER_ORDER = ['cc', 'ns', 'inf'];
