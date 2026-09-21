// Core "Who's Hues" board generation, coordinate helpers, and scoring.
// Modeled after the real Hues and Cues board: a 30 (wide) x 16 (tall)
// grid of 480 uniquely colored squares, addressed by a row letter
// (A-P) and a column number (1-30), e.g. "M14". Hue sweeps left to
// right around most of the color wheel; each row is a shade band
// (vivid/saturated near the top, softer pastels near the bottom).

export const ROWS = 16 // A .. P
export const COLS = 30 // 1 .. 30

export const ROW_LETTERS = Array.from({ length: ROWS }, (_, i) =>
  String.fromCharCode(65 + i)
)

export interface Coord {
  row: number // 0-based index into ROW_LETTERS
  col: number // 0-based index, display as col + 1
}

export interface Cell extends Coord {
  color: string // css hsl() string
  code: string // e.g. "M14"
}

/** Human readable coordinate code, e.g. row=12,col=13 -> "M14" */
export function coordToCode(c: Coord): string {
  return `${ROW_LETTERS[c.row]}${c.col + 1}`
}

/** Parse a code like "M14" back into a Coord. Returns null if invalid. */
export function codeToCoord(code: string): Coord | null {
  const match = /^([A-Pa-p])\s*(\d{1,2})$/.exec(code.trim())
  if (!match) return null
  const row = match[1].toUpperCase().charCodeAt(0) - 65
  const col = parseInt(match[2], 10) - 1
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
  return { row, col }
}

export interface Hsl {
  h: number
  s: number
  l: number
}

/**
 * Generates the color for a given cell. Columns sweep almost the
 * full hue wheel left-to-right (like the real board's rainbow loop),
 * while rows move from vivid/saturated near the top to soft, light
 * pastels near the bottom — the same "warm-to-cool, vivid-to-pastel"
 * read the physical board has.
 */
export function hslForCell(row: number, col: number): Hsl {
  const hue = (col / COLS) * 360
  const rowFactor = row / (ROWS - 1) // 0 top .. 1 bottom

  const lightness = 32 + rowFactor * 60 // 32% (rich) -> 92% (pale)
  const saturation = 90 - rowFactor * 50 // 90% (vivid) -> 40% (soft)

  return { h: hue, s: saturation, l: lightness }
}

export function colorForCell(row: number, col: number): string {
  const { h, s, l } = hslForCell(row, col)
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`
}

export function buildBoard(): Cell[][] {
  const board: Cell[][] = []
  for (let row = 0; row < ROWS; row++) {
    const rowCells: Cell[] = []
    for (let col = 0; col < COLS; col++) {
      rowCells.push({ row, col, color: colorForCell(row, col), code: coordToCode({ row, col }) })
    }
    board.push(rowCells)
  }
  return board
}

export function randomCoord(): Coord {
  return {
    row: Math.floor(Math.random() * ROWS),
    col: Math.floor(Math.random() * COLS),
  }
}

/** N random, mutually-distinct coordinates — used for the "choose a card" step. */
export function randomCoords(n: number): Coord[] {
  const seen = new Set<string>()
  const out: Coord[] = []
  while (out.length < n) {
    const c = randomCoord()
    const key = `${c.row}-${c.col}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

/** Chebyshev distance between two coordinates (matches 8-way adjacency on the grid). */
export function coordDistance(a: Coord, b: Coord): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

/** Points earned by a guess given the distance from the true target. */
export function pointsForDistance(distance: number): number {
  if (distance === 0) return 3
  if (distance === 1) return 2
  if (distance === 2) return 1
  return 0
}

export function scoreGuess(target: Coord, guess: Coord): { distance: number; points: number } {
  const distance = coordDistance(target, guess)
  return { distance, points: pointsForDistance(distance) }
}

/** Points the clue-giver earns for a round, given all guesser scores. */
export function clueGiverPoints(guesserPoints: number[]): number {
  return guesserPoints.reduce((sum, p) => sum + (p > 0 ? 1 : 0), 0)
}
