import { useEffect, useRef, useState } from 'react'
import ColorBoard, { type Marker } from '../components/ColorBoard'
import { coordToCode, type Coord } from '../game/colorBoard'
import {
  connectSocket,
  disconnectSocket,
  getSavedServerUrl,
  saveServerUrl,
  type RoomView,
} from '../net/socket'
import './OnlineGame.css'

const INITIALS_COLORS = ['#ff5c8a', '#4dd0e1', '#ffe600', '#7c4dff', '#4caf82', '#ff9800', '#f06292', '#90a4ae']

function initialsOf(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '?'
}

export default function OnlineGame() {
  const [serverUrl, setServerUrl] = useState(getSavedServerUrl())
  const [name, setName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [myId, setMyId] = useState<string | null>(null)
  const [room, setRoom] = useState<RoomView | null>(null)
  const [clueDraft, setClueDraft] = useState('')
  const [pendingGuess, setPendingGuess] = useState<Coord | null>(null)
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null)

  useEffect(() => {
    return () => disconnectSocket()
  }, [])

  function attach(socket: ReturnType<typeof connectSocket>) {
    socketRef.current = socket
    socket.on('connect', () => setMyId(socket.id ?? null))
    socket.on('room-update', (view: RoomView) => {
      setRoom(view)
      setError('')
      setPendingGuess(null)
      setClueDraft('')
    })
    socket.on('room-error', ({ message }: { message: string }) => {
      setError(message)
      setConnecting(false)
    })
    socket.on('connect_error', () => {
      setError(`Couldn't reach server at ${serverUrl}`)
      setConnecting(false)
    })
  }

  function createRoom() {
    setError('')
    setConnecting(true)
    saveServerUrl(serverUrl)
    const socket = connectSocket(serverUrl)
    attach(socket)
    socket.emit('create-room', { name })
    setConnecting(false)
  }

  function joinRoom() {
    if (!roomCodeInput.trim()) return
    setError('')
    setConnecting(true)
    saveServerUrl(serverUrl)
    const socket = connectSocket(serverUrl)
    attach(socket)
    socket.emit('join-room', { code: roomCodeInput.trim().toUpperCase(), name })
    setConnecting(false)
  }

  function startGame() {
    socketRef.current?.emit('start-game')
  }

  function submitClue() {
    if (!clueDraft.trim()) return
    socketRef.current?.emit('submit-clue', { clue: clueDraft.trim() })
  }

  function submitGuess() {
    if (!pendingGuess) return
    socketRef.current?.emit('submit-guess', { coord: pendingGuess })
  }

  function nextRound() {
    socketRef.current?.emit('next-round')
  }

  function leaveRoom() {
    disconnectSocket()
    setRoom(null)
    setMyId(null)
  }

  // --- Connect / Lobby screen ---
  if (!room) {
    return (
      <div className="panel stack" style={{ maxWidth: 460, width: '100%' }}>
        <h2>Online Multiplayer</h2>
        <p className="dim">
          One player creates a room and shares the code. Everyone else joins with that code. All
          players need to reach the same server — on the same Wi-Fi this usually just works with
          the default address.
        </p>
        <label className="field-label">Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <label className="field-label">Server address</label>
        <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="http://localhost:3001" />
        {error && <div className="error-text">{error}</div>}
        <div className="row">
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={connecting || !name.trim()} onClick={createRoom}>
            Create Room
          </button>
        </div>
        <div className="row">
          <input
            placeholder="Room code"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ flex: 1 }}
          />
          <button className="btn btn-accent3" disabled={connecting || !name.trim() || !roomCodeInput.trim()} onClick={joinRoom}>
            Join Room
          </button>
        </div>
      </div>
    )
  }

  const me = room.players.find((p) => p.id === myId)
  const clueGiver = room.players.find((p) => p.id === room.clueGiverId) ?? null
  const isClueGiver = !!clueGiver && clueGiver.id === myId
  const guessers = room.players.filter((p) => p.id !== room.clueGiverId)
  const iHaveSubmitted = !!myId && room.submittedIds.includes(myId)

  const scoreboard = (
    <div className="scoreboard">
      {room.players.map((p) => (
        <div key={p.id} className={`score-chip ${p.id === room.clueGiverId ? 'score-chip-active' : ''} ${!p.connected ? 'score-chip-offline' : ''}`}>
          <span className="score-initials" style={{ background: INITIALS_COLORS[room.players.indexOf(p) % INITIALS_COLORS.length] }}>
            {initialsOf(p.name)}
          </span>
          <span className="score-name">{p.name}{p.id === myId ? ' (you)' : ''}</span>
          <span className="score-value">{p.score}</span>
        </div>
      ))}
    </div>
  )

  if (room.phase === 'lobby') {
    return (
      <div className="panel stack" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="dim">Room code</div>
        <div className="room-code">{room.code}</div>
        <p className="dim">Share this code with friends. Need 2+ players to start.</p>
        {scoreboard}
        <button className="btn btn-primary" disabled={room.players.length < 2} onClick={startGame}>
          Start Game
        </button>
        <button className="btn btn-ghost" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>
    )
  }

  if (room.phase === 'clue') {
    if (isClueGiver && room.target) {
      return (
        <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
          <h2>Your secret color — {coordToCode(room.target)}</h2>
          <ColorBoard disabled markers={[{ coord: room.target, label: '★', className: 'marker-target' }]} />
          <div className="row">
            <input
              placeholder="Type your one-word clue..."
              value={clueDraft}
              onChange={(e) => setClueDraft(e.target.value)}
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && submitClue()}
            />
            <button className="btn btn-primary" onClick={submitClue} disabled={!clueDraft.trim()}>
              Lock In Clue
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="panel stack pass-screen">
        <div className="round-tag">Round {room.round}</div>
        <h2>Waiting for {clueGiver?.name} to give a clue...</h2>
        {scoreboard}
      </div>
    )
  }

  if (room.phase === 'guessing') {
    if (isClueGiver) {
      return (
        <div className="panel stack pass-screen">
          <div className="round-tag">Round {room.round} · Clue: "{room.clue}"</div>
          <h2>
            Waiting on guesses... ({room.submittedIds.length}/{guessers.length})
          </h2>
          {scoreboard}
        </div>
      )
    }
    if (iHaveSubmitted) {
      return (
        <div className="panel stack pass-screen">
          <div className="round-tag">Round {room.round} · Clue: "{room.clue}"</div>
          <h2>Guess locked in! Waiting on everyone else...</h2>
          <div className="dim">{room.submittedIds.length}/{guessers.length} submitted</div>
          {scoreboard}
        </div>
      )
    }
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <h2>
          {me?.name}, where's the clue "<span className="clue-word">{room.clue}</span>"?
        </h2>
        <ColorBoard selected={pendingGuess} onCellClick={setPendingGuess} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="dim">{pendingGuess ? `Selected: ${coordToCode(pendingGuess)}` : 'Click a square to guess'}</span>
          <button className="btn btn-primary" onClick={submitGuess} disabled={!pendingGuess}>
            Confirm Guess
          </button>
        </div>
      </div>
    )
  }

  if (room.phase === 'reveal' && room.reveal) {
    const { target, results, giverPoints } = room.reveal
    const markers: Marker[] = [
      { coord: target, label: '★', className: 'marker-target' },
      ...results.map((r, i) => {
        const player = room.players.find((p) => p.id === r.playerId)
        return {
          coord: r.guess,
          label: initialsOf(player?.name ?? '?'),
          className: `marker-guess marker-${i % INITIALS_COLORS.length}`,
        }
      }),
    ]
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <h2>
          The color was <strong>{coordToCode(target)}</strong> — clue was "{room.reveal.clue}"
        </h2>
        <ColorBoard disabled markers={markers} />
        <div className="stack">
          {results.map((r) => {
            const player = room.players.find((p) => p.id === r.playerId)
            return (
              <div className="row" key={r.playerId} style={{ justifyContent: 'space-between' }}>
                <span>{player?.name}</span>
                <span className="dim">{coordToCode(r.guess)} · {r.distance} away</span>
                <strong>+{r.points}</strong>
              </div>
            )
          })}
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{clueGiver?.name} (clue-giver)</span>
            <span />
            <strong>+{giverPoints}</strong>
          </div>
        </div>
        <button className="btn btn-primary" onClick={nextRound}>
          Next Round →
        </button>
        {scoreboard}
      </div>
    )
  }

  return null
}
