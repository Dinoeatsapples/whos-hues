// Core "Who's Hues" board generation, coordinate helpers, and scoring.
// The board is a grid of uniquely colored squares addressed by a
// row letter (A-X) and a column number (1-20), e.g. "M14".

export const ROWS = 24 // A .. X
export const COLS = 20 // 1 .. 20

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
  const match = /^([A-Xa-x])\s*(\d{1,2})$/.exec(code.trim())
  if (!match) return null
  const row = match[1].toUpperCase().charCodeAt(0) - 65
  const col = parseInt(match[2], 10) - 1
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
  return { row, col }
}

/**
 * Generates the color for a given cell. The last column is a
 * grayscale ramp (like the neutral column on the physical board);
 * every other column sweeps hue left-to-right while rows sweep
 * lightness top (light) to bottom (dark), with saturation easing
 * near the top/bottom so the board isn't neon at the extremes.
 */
export interface Hsl {
  h: number
  s: number
  l: number
}

export function hslForCell(row: number, col: number): Hsl {
  const isGrayCol = col === COLS - 1
  const lightness = 92 - (row / (ROWS - 1)) * 84 // 92% -> 8%

  if (isGrayCol) {
    return { h: 0, s: 0, l: lightness }
  }

  const hue = (col / (COLS - 1)) * 345 // leave a small seam near red wraparound
  const rowFactor = row / (ROWS - 1) // 0 top .. 1 bottom
  // Ease saturation down near the very light and very dark rows.
  const edgeEase = 1 - Math.pow(Math.abs(rowFactor - 0.5) * 2, 2) * 0.35
  const saturation = 78 * edgeEase

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
