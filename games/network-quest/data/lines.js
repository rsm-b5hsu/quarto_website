// Tiny helpers for writing dialogue as line arrays.
// A line is { speaker: 'sean' | npcId | 'narrator', text, expression?, if? }.
//   expression: 'neutral' | 'happy' | 'concerned'
//   if:         a condition (see engine.checkCond); the line only shows when it is true
// A nested array is a first-match group: the first entry whose `if` is true (or has
// no `if`) is used. An entry may be a single line or branch(cond, ...lines).

export const say = (speaker, text, expression) => (expression ? { speaker, text, expression } : { speaker, text });
export const nar = (text) => ({ speaker: 'narrator', text });
export const me = (text, expression) => say('sean', text, expression);
export const when = (cond, line) => ({ ...line, if: cond });
export const branch = (cond, ...lines) => ({ if: cond, lines });
export const otherwise = (...lines) => ({ lines });
