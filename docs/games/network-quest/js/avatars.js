// Simple cartoon avatars as inline SVG. No external images.
// Every avatar is drawn facing right; the right-hand speaker is mirrored with CSS.
//   look: { skin, hair, hairColor, shirt, build?, accessory? }
//     hair:      short | long | bun | curly | buzz | sidepart | ponytail | wavy | spiky | bob
//     build:     slim | regular | broad            (default regular)
//     accessory: one name or a list: glasses | earrings | tie | beanie | headband | blazer
//                | scarf | beard | mustache | stubble | cardigan
import { CHARACTERS } from '../data/characters.js';

export const EXPRESSIONS = ['neutral', 'happy', 'concerned'];
const INK = '#3a2a22';

const HAIR_BACK = {
  long: (c) => `<path d="M19 60 Q16 22 50 22 Q84 22 81 60 L84 108 Q68 100 66 84 L34 84 Q32 100 16 108 Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="52" cy="22" r="12" fill="${c}"/>`,
  ponytail: (c) => `<path d="M24 46 Q10 62 16 92 Q20 104 28 100 Q22 80 32 58 Z" fill="${c}"/>`,
  bob: (c) => `<path d="M20 58 Q18 24 52 24 Q84 24 82 58 L82 84 Q74 88 70 80 L34 80 Q28 88 20 84 Z" fill="${c}"/>`,
  wavy: (c) => `<path d="M20 56 Q16 24 50 22 Q84 22 82 56 Q86 70 80 82 Q72 76 74 66 L28 66 Q30 78 22 84 Q14 70 20 56 Z" fill="${c}"/>`,
};

const HAIR_FRONT = {
  short: (c) => `<path d="M23 56 Q20 25 50 25 Q80 25 77 54 Q72 37 52 36 Q36 36 31 44 Q27 48 23 56 Z" fill="${c}"/>`,
  long: (c) => `<path d="M23 54 Q26 27 52 27 Q76 28 78 52 Q66 38 48 38 Q32 40 23 54 Z" fill="${c}"/>`,
  bun: (c) => `<path d="M24 52 Q24 29 50 29 Q76 29 76 52 Q66 38 50 38 Q34 38 24 52 Z" fill="${c}"/>`,
  curly: (c) => [[27, 46], [31, 34], [42, 27], [55, 26], [67, 31], [74, 42], [77, 53], [24, 57]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join(''),
  buzz: (c) => `<path d="M25 52 Q25 30 50 30 Q75 30 75 50 Q70 40 50 40 Q31 40 25 52 Z" fill="${c}" opacity=".85"/>`,
  sidepart: (c) => `<path d="M24 56 Q20 26 52 25 Q80 26 78 50 Q76 42 66 38 Q56 34 44 40 Q40 36 34 40 Q28 46 24 56 Z" fill="${c}"/><path d="M44 40 Q47 30 58 28" stroke="${shade(c, 40)}" stroke-width="1.6" fill="none"/>`,
  ponytail: (c) => `<path d="M24 54 Q24 28 52 27 Q78 28 77 50 Q68 37 50 37 Q34 38 24 54 Z" fill="${c}"/><rect x="21" y="48" width="9" height="7" rx="3" fill="${shade(c, -30)}"/>`,
  wavy: (c) => `<path d="M23 54 Q24 26 52 26 Q78 27 78 50 Q72 40 64 42 Q58 36 50 41 Q42 36 36 42 Q30 44 23 54 Z" fill="${c}"/>`,
  spiky: (c) => `<path d="M24 54 L22 38 L30 42 L32 26 L40 34 L46 20 L52 32 L60 21 L63 34 L72 27 L71 40 L79 38 L77 52 Q70 40 50 40 Q32 40 24 54 Z" fill="${c}"/>`,
  bob: (c) => `<path d="M24 54 Q24 28 52 27 Q78 28 78 52 Q74 42 60 40 Q44 40 34 42 Q28 46 24 54 Z" fill="${c}"/>`,
};

const MOUTH = {
  neutral: `<path d="M50 75 L61 75" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
  happy: `<path d="M47 72 Q55 81 63 72" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
  concerned: `<path d="M48 78 Q55 72 62 78" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
};

const BROWS = {
  neutral: `<path d="M41 50 L50 50 M59 50 L68 50" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
  happy: `<path d="M41 50 Q45.5 47 50 50 M59 50 Q63.5 47 68 50" stroke="${INK}" stroke-width="2" stroke-linecap="round" fill="none" opacity=".55"/>`,
  concerned: `<path d="M41 52 L50 49 M59 49 L68 52" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`,
};

// Half-width of the shoulders and neck for each build.
const BUILDS = { slim: { w: 32, neck: 12 }, regular: { w: 41, neck: 14 }, broad: { w: 47, neck: 17 } };

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, v + amt));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function body(L, build) {
  const { w, neck } = BUILDS[build] || BUILDS.regular;
  const l = 50 - w, r = 50 + w;
  return `<rect x="${50 - neck / 2}" y="80" width="${neck}" height="22" rx="6" fill="${shade(L.skin, -28)}"/>
    <path d="M${l} 140 Q${l + 1} 103 50 99 Q${r - 1} 103 ${r} 140 Z" fill="${L.shirt}"/>
    <path d="M${50 - neck} 100 Q50 112 ${50 + neck} 100" fill="${shade(L.shirt, -30)}" opacity=".5"/>`;
}

// Accessories drawn under the face features (body layer) or over them (face layer).
const BODY_ACC = {
  tie: () => '<path d="M50 102 L55 102 L57 107 L54 128 L51 128 L48 107 Z" fill="#b23b2e"/><path d="M44 99 L50 104 L55 104 L61 99" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>',
  blazer: (L, build) => {
    const { w } = BUILDS[build] || BUILDS.regular;
    const l = 50 - w, r = 50 + w;
    return `<path d="M${l} 140 Q${l + 1} 103 50 99 L44 104 L48 140 Z" fill="#26324a"/><path d="M${r} 140 Q${r - 1} 103 50 99 L56 104 L52 140 Z" fill="#26324a"/><path d="M44 104 L50 99 L56 104 L50 116 Z" fill="#f4f1ea"/>`;
  },
  cardigan: (L, build) => {
    const { w } = BUILDS[build] || BUILDS.regular;
    const l = 50 - w, r = 50 + w;
    return `<path d="M${l} 140 Q${l + 1} 103 46 100 L46 140 Z" fill="${shade(L.shirt, -45)}"/><path d="M${r} 140 Q${r - 1} 103 54 100 L54 140 Z" fill="${shade(L.shirt, -45)}"/>`;
  },
  scarf: () => '<path d="M36 96 Q50 106 64 96 L66 104 Q50 114 34 104 Z" fill="#e0734f"/><path d="M58 104 L62 124 L54 124 L52 106 Z" fill="#c95f3d"/>',
};
const FACE_ACC = {
  glasses: () => '<g fill="none" stroke="#24262e" stroke-width="2.2"><circle cx="46" cy="59" r="7"/><circle cx="64" cy="59" r="7"/><path d="M53 59 L57 59 M39 58 L28 55"/></g>',
  earrings: () => '<circle cx="27" cy="70" r="2.8" fill="#f6c453" stroke="#b88a1c" stroke-width="1"/>',
  beanie: () => '<path d="M22 46 Q22 15 50 15 Q78 15 78 46 Z" fill="#f6c453"/><rect x="20" y="40" width="60" height="9" rx="4" fill="#e0a92e"/><circle cx="50" cy="13" r="5" fill="#e0a92e"/>',
  headband: () => '<path d="M24 46 Q50 30 78 44" stroke="#f08a7a" stroke-width="5" fill="none" stroke-linecap="round"/>',
  beard: (L) => `<path d="M30 66 Q32 90 54 90 Q74 90 77 66 Q72 80 64 80 Q56 76 46 80 Q36 80 30 66 Z" fill="${L.hairColor}"/>`,
  stubble: (L) => `<path d="M32 70 Q36 88 54 88 Q72 88 76 70 Q70 82 54 83 Q38 82 32 70 Z" fill="${L.hairColor}" opacity=".28"/>`,
  mustache: (L) => `<path d="M47 70 Q52 67 55 70 Q58 67 63 70 Q60 73 55 72 Q50 73 47 70 Z" fill="${L.hairColor}"/>`,
};

// SVG markup for a character. Unknown ids / narrator return ''.
export function avatarSVG(id, expression = 'neutral') {
  const c = CHARACTERS[id];
  if (!c || !c.look) return '';
  const L = c.look;
  const build = L.build || 'regular';
  const acc = [].concat(L.accessory || []);
  const ex = EXPRESSIONS.includes(expression) ? expression : 'neutral';
  const skinDark = shade(L.skin, -28);
  const bodyAcc = acc.filter((a) => BODY_ACC[a]).map((a) => BODY_ACC[a](L, build)).join('');
  const faceUnder = acc.filter((a) => ['beard', 'stubble'].includes(a)).map((a) => FACE_ACC[a](L)).join('');
  const faceOver = acc.filter((a) => FACE_ACC[a] && !['beard', 'stubble'].includes(a)).map((a) => FACE_ACC[a](L)).join('');
  return `<svg class="av-svg" viewBox="0 0 100 140" aria-hidden="true" focusable="false">
    ${HAIR_BACK[L.hair] ? HAIR_BACK[L.hair](L.hairColor) : ''}
    ${body(L, build)}
    ${bodyAcc}
    <circle cx="26" cy="61" r="6" fill="${skinDark}"/>
    <ellipse cx="52" cy="60" rx="${build === 'broad' ? 27 : build === 'slim' ? 25 : 26}" ry="29" fill="${L.skin}"/>
    ${faceUnder}
    ${HAIR_FRONT[L.hair] ? HAIR_FRONT[L.hair](L.hairColor) : ''}
    ${BROWS[ex]}
    <circle cx="46" cy="59" r="3.2" fill="#2a1f1a"/><circle cx="64" cy="59" r="3.2" fill="#2a1f1a"/>
    <path d="M58 63 Q62 68 57 69.5" stroke="${skinDark}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${ex === 'happy' ? '<circle cx="40" cy="69" r="4" fill="#f08a7a" opacity=".35"/><circle cx="70" cy="69" r="4" fill="#f08a7a" opacity=".35"/>' : ''}
    ${MOUTH[ex]}
    ${faceOver}
  </svg>`;
}
