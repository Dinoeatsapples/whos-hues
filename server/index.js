// Who's Hues — online multiplayer server (Socket.IO)
//
// Run with: npm run server
// Players connect from the web/desktop client and are grouped into
// rooms by a short room code. All game logic (whose turn it is,
// scoring, hiding the secret target from guessers) is authoritative
// here on the server.

import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
const ROWS = 16
const COLS = 30
const CARD_OPTIONS = 6

function randomCoord() {
  return { row: Math.floor(Math.random() * ROWS), col: Math.floor(Math.random() * COLS) }
}

function randomCoords(n) {
  const seen = new Set()
  const out = []
  while (out.length < n) {
    const c = randomCoord()
    const key = `${c.row}-${c.col}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function coordDistance(a, b) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

function pointsForDistance(d) {
  if (d === 0) return 3
  if (d === 1) return 2
  if (d === 2) return 1
  return 0
}

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/** @type {Map<string, Room>} */
const rooms = new Map()

function createRoom() {
  let code
  do {
    code = randomRoomCode()
  } while (rooms.has(code))
  const room = {
    code,
    players: [], // { id, name, score, connected }
    phase: 'lobby', // lobby | choose | clue | guessing | reveal
    round: 0,
    clueGiverIdx: -1,
    candidates: [],
    target: null,
    clue: '',
    guesses: {}, // playerId -> coord
    lastReveal: null,
  }
  rooms.set(code, room)
  return room
}

function publicPlayers(room) {
  return room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, connected: p.connected }))
}

function guessersOf(room) {
  return room.players.filter((_, i) => i !== room.clueGiverIdx)
}

function viewFor(room, socketId) {
  const clueGiver = room.clueGiverIdx >= 0 ? room.players[room.clueGiverIdx] : null
  const isClueGiver = clueGiver?.id === socketId
  const submittedIds = Object.keys(room.guesses)
  return {
    code: room.code,
    players: publicPlayers(room),
    phase: room.phase,
    round: room.round,
    clueGiverId: clueGiver?.id ?? null,
    clue: room.clue,
    candidates: room.phase === 'choose' && isClueGiver ? room.candidates : [],
    target: room.phase === 'reveal' || (isClueGiver && room.phase !== 'choose') ? room.target : null,
    submittedIds: room.phase === 'guessing' || room.phase === 'reveal' ? submittedIds : [],
    reveal: room.phase === 'reveal' ? room.lastReveal : null,
  }
}

function broadcastRoom(io, room) {
  for (const p of room.players) {
    io.to(p.id).emit('room-update', viewFor(room, p.id))
  }
}

function startRound(room) {
  room.round += 1
  room.clueGiverIdx = (room.clueGiverIdx + 1) % room.players.length
  room.candidates = randomCoords(CARD_OPTIONS)
  room.target = null
  room.clue = ''
  room.guesses = {}
  room.phase = 'choose'
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end("Who's Hues multiplayer server is running.\n")
})

const io = new Server(httpServer, {
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  let currentRoomCode = null

  socket.on('create-room', ({ name }) => {
    const room = createRoom()
    room.players.push({ id: socket.id, name: name?.trim() || 'Host', score: 0, connected: true })
    currentRoomCode = room.code
    socket.join(room.code)
    broadcastRoom(io, room)
  })

  socket.on('join-room', ({ code, name }) => {
    const room = rooms.get((code || '').toUpperCase())
    if (!room) {
      socket.emit('room-error', { message: `Room "${code}" not found.` })
      return
    }
    if (room.players.some((p) => p.id === socket.id)) return
    room.players.push({ id: socket.id, name: name?.trim() || `Player ${room.players.length + 1}`, score: 0, connected: true })
    currentRoomCode = room.code
    socket.join(room.code)
    broadcastRoom(io, room)
  })

  socket.on('start-game', () => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.players.length < 2) return
    startRound(room)
    broadcastRoom(io, room)
  })

  socket.on('choose-color', ({ coord }) => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.phase !== 'choose') return
    const clueGiver = room.players[room.clueGiverIdx]
    if (clueGiver.id !== socket.id) return
    const isValid = room.candidates.some((c) => c.row === coord?.row && c.col === coord?.col)
    if (!isValid) return
    room.target = coord
    room.phase = 'clue'
    broadcastRoom(io, room)
  })

  socket.on('submit-clue', ({ clue }) => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.phase !== 'clue') return
    const clueGiver = room.players[room.clueGiverIdx]
    if (clueGiver.id !== socket.id) return
    room.clue = (clue || '').trim().slice(0, 40)
    if (!room.clue) return
    room.phase = 'guessing'
    broadcastRoom(io, room)
  })

  socket.on('submit-guess', ({ coord }) => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.phase !== 'guessing') return
    const clueGiver = room.players[room.clueGiverIdx]
    if (clueGiver.id === socket.id) return
    if (!room.players.some((p) => p.id === socket.id)) return
    room.guesses[socket.id] = coord
    const guessers = guessersOf(room)
    const allIn = guessers.every((g) => room.guesses[g.id])
    if (allIn) {
      const results = guessers.map((g) => {
        const guess = room.guesses[g.id]
        const distance = coordDistance(room.target, guess)
        const points = pointsForDistance(distance)
        return { playerId: g.id, guess, distance, points }
      })
      const giverPoints = results.reduce((sum, r) => sum + (r.points > 0 ? 1 : 0), 0)
      for (const r of results) {
        const p = room.players.find((pl) => pl.id === r.playerId)
        if (p) p.score += r.points
      }
      const giver = room.players.find((p) => p.id === clueGiver.id)
      if (giver) giver.score += giverPoints

      room.lastReveal = { target: room.target, clue: room.clue, results, giverPoints, clueGiverId: clueGiver.id }
      room.phase = 'reveal'
    }
    broadcastRoom(io, room)
  })

  socket.on('next-round', () => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.phase !== 'reveal') return
    startRound(room)
    broadcastRoom(io, room)
  })

  socket.on('disconnect', () => {
    if (!currentRoomCode) return
    const room = rooms.get(currentRoomCode)
    if (!room) return
    const player = room.players.find((p) => p.id === socket.id)
    if (player) player.connected = false
    broadcastRoom(io, room)
    const anyConnected = room.players.some((p) => p.connected)
    if (!anyConnected) rooms.delete(currentRoomCode)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Who's Hues server listening on http://localhost:${PORT}`)
})
