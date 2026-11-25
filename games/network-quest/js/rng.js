// Seeded randomness so demo runs are reproducible.
// The same seed + the same day always draws the same events, activities and rolls.

export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// mulberry32
export function rng(...parts) {
  let a = hashStr(parts.join('|'));
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(list, r) { return list.length ? list[Math.floor(r() * list.length)] : undefined; }

// Weighted pick without replacement: returns `n` distinct items.
export function weightedSample(items, weightOf, n, r) {
  const pool = items.slice();
  const out = [];
  while (out.length < n && pool.length) {
    const ws = pool.map((x) => Math.max(0.0001, weightOf(x)));
    const total = ws.reduce((a, b) => a + b, 0);
    let x = r() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) { x -= ws[i]; if (x <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
