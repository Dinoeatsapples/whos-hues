// Simple "AI clue-giver" for single-player practice mode.
// Picks a random target cell and comes up with a plausible one-word
// clue by matching the cell's hue/lightness/saturation against a
// curated word bank, plus a little randomness so it's not always the
// same word for the same color.

import { COLS, ROWS, type Coord } from './colorBoard'

interface ClueEntry {
  word: string
  hue: [number, number] | null // null = grayscale word
  lightness: [number, number] // 0-100
}

const CLUE_BANK: ClueEntry[] = [
  // Grayscale / neutrals
  { word: 'Snow', hue: null, lightness: [85, 100] },
  { word: 'Cloud', hue: null, lightness: [75, 95] },
  { word: 'Fog', hue: null, lightness: [55, 80] },
  { word: 'Ash', hue: null, lightness: [35, 60] },
  { word: 'Slate', hue: null, lightness: [20, 45] },
  { word: 'Coal', hue: null, lightness: [0, 20] },
  { word: 'Shadow', hue: null, lightness: [0, 15] },

  // Reds
  { word: 'Blood', hue: [350, 360], lightness: [15, 45] },
  { word: 'Cherry', hue: [345, 360], lightness: [30, 55] },
  { word: 'Rose', hue: [340, 355], lightness: [55, 80] },
  { word: 'Brick', hue: [0, 12], lightness: [25, 45] },
  { word: 'Fire Truck', hue: [0, 8], lightness: [40, 60] },
  { word: 'Salmon', hue: [0, 15], lightness: [65, 85] },
  { word: 'Blush', hue: [340, 10], lightness: [75, 92] },

  // Oranges
  { word: 'Rust', hue: [15, 30], lightness: [25, 45] },
  { word: 'Pumpkin', hue: [20, 35], lightness: [45, 65] },
  { word: 'Tangerine', hue: [18, 32], lightness: [55, 72] },
  { word: 'Peach', hue: [15, 35], lightness: [72, 90] },
  { word: 'Terracotta', hue: [10, 25], lightness: [40, 58] },

  // Yellows
  { word: 'Mustard', hue: [40, 55], lightness: [30, 50] },
  { word: 'Lemon', hue: [45, 60], lightness: [60, 82] },
  { word: 'Banana', hue: [45, 58], lightness: [70, 88] },
  { word: 'Honey', hue: [35, 50], lightness: [45, 65] },
  { word: 'Butter', hue: [40, 55], lightness: [75, 90] },
  { word: 'Gold', hue: [40, 52], lightness: [40, 60] },

  // Greens
  { word: 'Lime', hue: [75, 95], lightness: [45, 68] },
  { word: 'Grass', hue: [85, 110], lightness: [30, 50] },
  { word: 'Forest', hue: [100, 140], lightness: [12, 30] },
  { word: 'Emerald', hue: [140, 160], lightness: [22, 42] },
  { word: 'Mint', hue: [140, 170], lightness: [65, 85] },
  { word: 'Olive', hue: [55, 80], lightness: [22, 40] },
  { word: 'Pickle', hue: [70, 95], lightness: [25, 42] },
  { word: 'Seaweed', hue: [110, 150], lightness: [20, 38] },

  // Cyans / teals
  { word: 'Teal', hue: [175, 195], lightness: [20, 42] },
  { word: 'Turquoise', hue: [170, 190], lightness: [45, 68] },
  { word: 'Aqua', hue: [180, 200], lightness: [55, 78] },
  { word: 'Lagoon', hue: [185, 205], lightness: [35, 55] },

  // Blues
  { word: 'Sky', hue: [200, 215], lightness: [65, 85] },
  { word: 'Ocean', hue: [205, 225], lightness: [25, 48] },
  { word: 'Denim', hue: [210, 225], lightness: [30, 50] },
  { word: 'Navy', hue: [220, 240], lightness: [10, 28] },
  { word: 'Blueberry', hue: [225, 245], lightness: [25, 45] },
  { word: 'Cobalt', hue: [220, 235], lightness: [30, 48] },
  { word: 'Ice', hue: [190, 215], lightness: [78, 95] },

  // Purples / violets
  { word: 'Grape', hue: [265, 285], lightness: [25, 48] },
  { word: 'Lavender', hue: [250, 275], lightness: [65, 85] },
  { word: 'Plum', hue: [280, 300], lightness: [20, 42] },
  { word: 'Violet', hue: [265, 285], lightness: [45, 65] },
  { word: 'Eggplant', hue: [275, 295], lightness: [12, 28] },
  { word: 'Amethyst', hue: [270, 290], lightness: [35, 55] },

  // Pinks / magentas
  { word: 'Bubblegum', hue: [320, 340], lightness: [60, 80] },
  { word: 'Magenta', hue: [305, 325], lightness: [40, 60] },
  { word: 'Flamingo', hue: [325, 345], lightness: [55, 75] },
  { word: 'Fuchsia', hue: [310, 330], lightness: [35, 55] },
  { word: 'Cotton Candy', hue: [300, 330], lightness: [70, 88] },

  // Browns (low-saturation warm, approximated via lightness+hue band)
  { word: 'Chocolate', hue: [15, 35], lightness: [15, 30] },
  { word: 'Coffee', hue: [15, 35], lightness: [10, 25] },
  { word: 'Sand', hue: [30, 50], lightness: [55, 78] },
  { word: 'Latte', hue: [25, 45], lightness: [55, 75] },
]

function hueInRange(hue: number, range: [number, number]): boolean {
  const [lo, hi] = range
  if (lo <= hi) return hue >= lo && hue <= hi
  // wraparound range, e.g. [350, 10]
  return hue >= lo || hue <= hi
}

/**
 * Given the true HSL of a target color, pick a plausible one-word clue.
 * Falls back to a generic descriptor if nothing matches closely.
 */
export function generateClue(hue: number, saturation: number, lightness: number): string {
  const isGray = saturation < 15
  const candidates = CLUE_BANK.filter((entry) => {
    const lightnessOk = lightness >= entry.lightness[0] - 10 && lightness <= entry.lightness[1] + 10
    if (!lightnessOk) return false
    if (entry.hue === null) return isGray
    if (isGray) return false
    return hueInRange(hue, entry.hue)
  })

  if (candidates.length === 0) {
    // Generic fallback based on lightness alone.
    if (lightness > 80) return 'Pale'
    if (lightness < 20) return 'Dark'
    return 'Muted'
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  return pick.word
}

export function pickAiTarget(): Coord {
  return {
    row: Math.floor(Math.random() * ROWS),
    col: Math.floor(Math.random() * COLS),
  }
}
