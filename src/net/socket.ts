import { io, type Socket } from 'socket.io-client'
import type { Coord } from '../game/colorBoard'

export interface RoomPlayerView {
  id: string
  name: string
  score: number
  connected: boolean
}

export interface RoomRevealView {
  target: Coord
  clue: string
  results: { playerId: string; guess: Coord; distance: number; points: number }[]
  giverPoints: number
  clueGiverId: string
}

export interface RoomView {
  code: string
  players: RoomPlayerView[]
  phase: 'lobby' | 'choose' | 'clue' | 'guessing' | 'reveal'
  round: number
  clueGiverId: string | null
  clue: string
  candidates: Coord[] // only populated for the clue-giver during the 'choose' phase
  target: Coord | null // only populated for the clue-giver, or everyone during reveal
  submittedIds: string[]
  reveal: RoomRevealView | null
}

const DEFAULT_SERVER_URL = 'http://localhost:3001'

export function getSavedServerUrl(): string {
  return localStorage.getItem('whos-hues-server-url') || DEFAULT_SERVER_URL
}

export function saveServerUrl(url: string) {
  localStorage.setItem('whos-hues-server-url', url)
}

let socket: Socket | null = null

export function connectSocket(serverUrl: string): Socket {
  if (socket) {
    socket.disconnect()
  }
  socket = io(serverUrl, { transports: ['websocket', 'polling'] })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
