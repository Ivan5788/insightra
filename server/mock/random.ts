/**
 * Deterministic pseudo-random helpers.
 *
 * Math.random() would give different numbers on every request, so KPI cards
 * and charts could never agree. A *seeded* generator returns the same
 * sequence for the same seed → the same date always produces the same data.
 */

/** Mulberry32: tiny, fast 32-bit seeded PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a string hash → 32-bit integer seed. */
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export type Rng = () => number

/** Pick an index according to relative weights. */
export function weightedIndex(rng: Rng, weights: readonly number[]): number {
  let total = 0
  for (const w of weights) total += w
  let r = rng() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!
    if (r < 0) return i
  }
  return weights.length - 1
}

/** Random multiplier around 1, e.g. jitter(rng, 0.1) → 0.9 … 1.1 */
export function jitter(rng: Rng, amount: number): number {
  return 1 - amount + rng() * amount * 2
}
