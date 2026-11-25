// All character names live here. Scenes reference characters by id only,
// so renaming anyone is a one-line change in this file.
//   name     – full name (speaker label)
//   display  – how they're referred to inside dialogue ({c:id} token)
//   role     – short role line under the avatar
//   initials – small avatar text (chips, fallbacks)
//   color    – accent color
//   look     – cartoon avatar (see js/avatars.js for every option):
//              skin, hair, hairColor, shirt, build (slim | regular | broad),
//              accessory (one name or a list, e.g. ['blazer', 'glasses'])

export const PLAYER_DEFAULT_NAME = 'Sean';
export const COMPANY = 'Northwind Analytics'; // fictional firm

export const CHARACTERS = {
  narrator: { name: '', display: '', role: '', initials: '✦', color: '#5b6475' },

  // The player. The label uses the player's chosen name (Settings).
  sean: { name: 'Sean', display: 'you', role: 'You', initials: 'S', color: '#138a7d',
    look: { skin: '#e8b48f', hair: 'short', hairColor: '#2b2118', shirt: '#1a9e8f', build: 'regular', accessory: null } },

  // Level 1 — final-semester MSBA student
  gian:  { name: 'Gian Takeshi', display: 'Gian', role: 'Alum · Product analytics', initials: 'GT', color: '#1f6fb2',
    look: { skin: '#f1c9a5', hair: 'sidepart', hairColor: '#3b2a1e', shirt: '#9cc3e6', build: 'regular', accessory: ['blazer', 'glasses', 'stubble'] } },
  mercer: { name: 'Professor Daniel Mercer', display: 'Professor Mercer', role: 'Managerial Decision Making professor', initials: 'DM', color: '#5b4bb7',
    look: { skin: '#e2b28c', hair: 'short', hairColor: '#8a8178', shirt: '#5b4bb7', build: 'regular', accessory: ['cardigan', 'beard'] } },
  emily: { name: 'Emily', display: 'Emily', role: 'Classmate · friendly rival', roles: { 3: 'Peer manager · competes for the same budget' }, initials: 'E', color: '#d0603f',
    look: { skin: '#f3d2b8', hair: 'ponytail', hairColor: '#b5562b', shirt: '#e0734f', build: 'slim', accessory: 'earrings' } },
  molly: { name: 'Molly', display: 'Molly', role: 'Recruiter · Northwind Analytics', initials: 'M', color: '#c27c0e',
    look: { skin: '#c68e63', hair: 'bun', hairColor: '#3a2416', shirt: '#d4900f', build: 'regular', accessory: ['earrings', 'scarf'] } },

  // Level 2 — new Data Analyst at Northwind
  ted:     { name: 'Ted', display: 'Ted', role: 'Your manager · Analytics', initials: 'T', color: '#3c6e9f',
    look: { skin: '#f0c7a2', hair: 'wavy', hairColor: '#c9a46a', shirt: '#3c6e9f', build: 'broad', accessory: ['tie', 'mustache'] } },
  ben:     { name: 'Ben', display: 'Ben', role: 'Finance', initials: 'B', color: '#2f8a57',
    look: { skin: '#8d5a3b', hair: 'buzz', hairColor: '#141414', shirt: '#2f8a57', build: 'broad', accessory: ['glasses', 'beard'] } },
  jihee:   { name: 'Jihee', display: 'Jihee', role: 'Marketing', initials: 'J', color: '#c2417a',
    look: { skin: '#f2cfae', hair: 'bob', hairColor: '#17151a', shirt: '#c2417a', build: 'slim', accessory: 'headband' } },
  shalini: { name: 'Shalini', display: 'Shalini', role: 'Engineering', initials: 'S', color: '#7a5af0',
    look: { skin: '#a8714c', hair: 'curly', hairColor: '#2a1a12', shirt: '#7a5af0', build: 'regular', accessory: 'beanie' } },

  // Level 3 — first-time manager
  teresa: { name: 'Teresa', display: 'Teresa', role: 'VP · your skip-level', initials: 'Te', color: '#7b2d43',
    look: { skin: '#e8b48f', hair: 'long', hairColor: '#8a8a8a', shirt: '#7b2d43', build: 'regular', accessory: ['blazer', 'earrings'] } },
  naveen: { name: 'Naveen', display: 'Naveen', role: 'Your report · top performer', initials: 'N', color: '#2e6f95',
    look: { skin: '#9a6440', hair: 'sidepart', hairColor: '#0f0c0a', shirt: '#2e6f95', build: 'slim', accessory: 'stubble' } },
  ashley: { name: 'Ashley', display: 'Ashley', role: 'Your report · new hire', initials: 'A', color: '#d98a3d',
    look: { skin: '#fbe0c9', hair: 'ponytail', hairColor: '#c7782f', shirt: '#d98a3d', build: 'slim', accessory: 'glasses' } },
  ray:    { name: 'Ray', display: 'Ray', role: 'Your report · 15-year veteran', initials: 'R', color: '#556b2f',
    look: { skin: '#d8a27c', hair: 'buzz', hairColor: '#b9b9b9', shirt: '#556b2f', build: 'broad', accessory: ['cardigan', 'mustache'] } },

  // Contacts you can meet through activities (mixers, panels, volunteering).
  priya:  { name: 'Priya', display: 'Priya', role: 'Data scientist · met through an activity', initials: 'P', color: '#b8577e', contact: 1,
    look: { skin: '#b07a52', hair: 'long', hairColor: '#1d1410', shirt: '#f0b44c', build: 'slim', accessory: 'earrings' } },
  marcus: { name: 'Marcus', display: 'Marcus', role: 'Analytics manager at a startup', initials: 'Mr', color: '#4b7a3a', contact: 1,
    look: { skin: '#6f4630', hair: 'spiky', hairColor: '#111', shirt: '#4b7a3a', build: 'regular', accessory: null } },
  dana:   { name: 'Dana', display: 'Dana', role: 'Career coach', initials: 'D', color: '#6d5ca8', contact: 1,
    look: { skin: '#f4d6c0', hair: 'bob', hairColor: '#a3793d', shirt: '#6d5ca8', build: 'regular', accessory: 'glasses' } },
  omar:   { name: 'Omar', display: 'Omar', role: 'Sales operations', initials: 'O', color: '#a1622b', contact: 2,
    look: { skin: '#c48b5e', hair: 'short', hairColor: '#1e1712', shirt: '#a1622b', build: 'broad', accessory: 'stubble' } },
  grace:  { name: 'Grace', display: 'Grace', role: 'Product manager', initials: 'G', color: '#2a7f8f', contact: 2,
    look: { skin: '#f0cfae', hair: 'ponytail', hairColor: '#3b2a20', shirt: '#2a7f8f', build: 'slim', accessory: null } },
  leo:    { name: 'Leo', display: 'Leo', role: 'Data engineer on another team', initials: 'L', color: '#59607a', contact: 2,
    look: { skin: '#e6b995', hair: 'curly', hairColor: '#6b4a2b', shirt: '#59607a', build: 'regular', accessory: 'glasses' } },
  kofi:   { name: 'Kofi', display: 'Kofi', role: 'Engineering manager on another team', initials: 'K', color: '#3f5f8a', contact: 3,
    look: { skin: '#5e3b26', hair: 'short', hairColor: '#0d0d0d', shirt: '#3f5f8a', build: 'broad', accessory: 'glasses' } },
  mei:    { name: 'Mei', display: 'Mei', role: 'Director, Operations', initials: 'Me', color: '#a33b5b', contact: 3,
    look: { skin: '#f3d3b5', hair: 'bun', hairColor: '#1a1414', shirt: '#a33b5b', build: 'slim', accessory: 'blazer' } },
  dario:  { name: 'Dario', display: 'Dario', role: 'Manager coach', initials: 'Da', color: '#7d6a2d', contact: 3,
    look: { skin: '#dcae86', hair: 'wavy', hairColor: '#3d2b1d', shirt: '#7d6a2d', build: 'regular', accessory: 'beard' } },
};

// Level-specific role text (e.g. Emily returns as a peer manager in Level 3).
export const roleFor = (id, level) => {
  const c = CHARACTERS[id];
  return c ? ((c.roles && c.roles[level]) || c.role) : '';
};

// Contacts available to meet in each level (through activities).
export const CONTACTS = {
  1: ['priya', 'marcus', 'dana'],
  2: ['omar', 'grace', 'leo'],
  3: ['kofi', 'mei', 'dario'],
};

// Who you can "Connect" with each level.
export const CAST = {
  1: ['gian', 'mercer', 'emily', 'molly'],
  2: ['ted', 'ben', 'jihee', 'shalini'],
  3: ['teresa', 'emily', 'naveen', 'ashley', 'ray'],
};

// Your three direct reports in Level 3 (Team Morale is about them).
export const REPORTS = ['naveen', 'ashley', 'ray'];
// Your Level 2 network, which carries into Level 3.
export const L2_NETWORK = ['ted', 'ben', 'jihee', 'shalini'];

// Cross-functional partners who count as "allies" (trust ≥ 3) in Level 2.
// In Level 3, allies are your Level 2 network members at trust ≥ 3.
export const ALLY_POOL = { 2: ['ben', 'jihee', 'shalini'], 3: ['ted', 'ben', 'jihee', 'shalini'] };

export const START_TRUST = { gian: 0, mercer: 1, emily: 2, molly: 0, ted: 1, ben: 0, jihee: 0, shalini: 0, teresa: 1, naveen: 2, ashley: 1, ray: 0 };

// Old ids → new ids (save migration).
export const RENAMED_IDS = { maya: 'gian' };
