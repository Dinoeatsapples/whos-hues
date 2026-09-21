import { io } from 'socket.io-client'

const URL = 'http://localhost:3001'
const a = io(URL)
const b = io(URL)

function log(who, event, data) {
  console.log(`[${who}] ${event}`, JSON.stringify(data))
}

let roomCode = null

a.on('connect', () => {
  a.emit('create-room', { name: 'Alice' })
})

a.on('room-update', (view) => {
  log('A', 'room-update', view)
  if (view.phase === 'lobby' && !roomCode) {
    roomCode = view.code
    b.emit('join-room', { code: roomCode, name: 'Bob' })
  }
  if (view.phase === 'lobby' && view.players.length === 2) {
    a.emit('start-game')
  }
  if (view.phase === 'choose' && view.clueGiverId === a.id) {
    a.emit('choose-color', { coord: view.candidates[0] })
  }
  if (view.phase === 'clue' && view.clueGiverId === a.id) {
    a.emit('submit-clue', { clue: 'Ocean' })
  }
  if (view.phase === 'guessing' && view.clueGiverId !== a.id) {
    a.emit('submit-guess', { coord: { row: 5, col: 5 } })
  }
  if (view.phase === 'reveal') {
    console.log('SMOKE TEST PASSED: reveal reached', view.reveal)
    process.exit(0)
  }
})

b.on('room-update', (view) => {
  log('B', 'room-update', view)
  if (view.phase === 'guessing' && view.clueGiverId !== b.id) {
    b.emit('submit-guess', { coord: { row: 6, col: 5 } })
  }
})

a.on('room-error', (e) => console.error('A error', e))
b.on('room-error', (e) => console.error('B error', e))

setTimeout(() => {
  console.error('SMOKE TEST FAILED: timed out')
  process.exit(1)
}, 8000)
