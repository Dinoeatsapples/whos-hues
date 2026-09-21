import type { Coord } from './colorBoard'

export type GameMode = 'local' | 'single' | 'online'

export interface Player {
  id: string
  name: string
  score: number
}

export interface RoundResult {
  target: Coord
  clue: string
  clueGiverId: string
  guesses: { playerId: string; guess: Coord; distance: number; points: number }[]
}
