import { useMemo, useState } from 'react'
import ColorBoard, { type Marker } from '../components/ColorBoard'
import {
  clueGiverPoints,
  coordToCode,
  randomCoord,
  scoreGuess,
  type Coord,
} from '../game/colorBoard'
import type { Player } from '../game/types'
import './LocalGame.css'

type Phase = 'setup' | 'clue-pass' | 'clue-reveal' | 'guess-pass' | 'guessing' | 'reveal'

let uid = 0
function nextId() {
  uid += 1
  return `p${uid}`
}

const INITIALS_COLORS = ['#ff5c8a', '#4dd0e1', '#ffe600', '#7c4dff', '#4caf82', '#ff9800', '#f06292', '#90a4ae']

function initialsOf(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '?'
}

export default function LocalGame() {
  const [players, setPlayers] = useState<Player[]>([
    { id: nextId(), name: '', score: 0 },
    { id: nextId(), name: '', score: 0 },
  ])
  const [phase, setPhase] = useState<Phase>('setup')
  const [round, setRound] = useState(1)
  const [clueGiverIdx, setClueGiverIdx] = useState(0)
  const [target, setTarget] = useState<Coord>(() => randomCoord())
  const [clue, setClue] = useState('')
  const [guesses, setGuesses] = useState<Record<string, Coord>>({})
  const [pendingGuess, setPendingGuess] = useState<Coord | null>(null)
  const [guesserPointer, setGuesserPointer] = useState(0)

  const guessers = useMemo(
    () => players.filter((_, i) => i !== clueGiverIdx),
    [players, clueGiverIdx]
  )
  const clueGiver = players[clueGiverIdx]

  function updatePlayerName(id: string, name: string) {
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)))
  }

  function addPlayer() {
    setPlayers((ps) => [...ps, { id: nextId(), name: '', score: 0 }])
  }

  function removePlayer(id: string) {
    setPlayers((ps) => (ps.length > 2 ? ps.filter((p) => p.id !== id) : ps))
  }

  function startGame() {
    setPlayers((ps) => ps.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` })))
    setPhase('clue-pass')
  }

  function beginClueTurn() {
    setTarget(randomCoord())
    setClue('')
    setPhase('clue-reveal')
  }

  function submitClue() {
    if (!clue.trim()) return
    setGuesses({})
    setGuesserPointer(0)
    setPendingGuess(null)
    setPhase(guessers.length > 0 ? 'guess-pass' : 'reveal')
  }

  function beginGuessTurn() {
    setPendingGuess(null)
    setPhase('guessing')
  }

  function confirmGuess() {
    if (!pendingGuess) return
    const guesser = guessers[guesserPointer]
    setGuesses((g) => ({ ...g, [guesser.id]: pendingGuess }))
    if (guesserPointer + 1 < guessers.length) {
      setGuesserPointer((i) => i + 1)
      setPhase('guess-pass')
    } else {
      setPhase('reveal')
    }
  }

  const roundScoring = useMemo(() => {
    if (phase !== 'reveal') return null
    const results = guessers.map((g) => {
      const guess = guesses[g.id]
      if (!guess) return { player: g, points: 0, distance: -1 }
      const { distance, points } = scoreGuess(target, guess)
      return { player: g, points, distance }
    })
    const giverPts = clueGiverPoints(results.map((r) => r.points))
    return { results, giverPts }
  }, [phase, guessers, guesses, target])

  function applyScoresAndContinue() {
    if (!roundScoring) return
    setPlayers((ps) =>
      ps.map((p) => {
        if (p.id === clueGiver.id) return { ...p, score: p.score + roundScoring.giverPts }
        const r = roundScoring.results.find((res) => res.player.id === p.id)
        return r ? { ...p, score: p.score + r.points } : p
      })
    )
    setClueGiverIdx((i) => (i + 1) % players.length)
    setRound((r) => r + 1)
    setPhase('clue-pass')
  }

  if (phase === 'setup') {
    return (
      <div className="panel stack" style={{ maxWidth: 480, width: '100%' }}>
        <h2>Pass &amp; Play Setup</h2>
        <p className="dim">Add everyone playing on this device (3+ recommended).</p>
        <div className="stack">
          {players.map((p, i) => (
            <div className="row" key={p.id}>
              <input
                placeholder={`Player ${i + 1} name`}
                value={p.name}
                onChange={(e) => updatePlayerName(p.id, e.target.value)}
                style={{ flex: 1 }}
              />
              {players.length > 2 && (
                <button className="btn btn-ghost" onClick={() => removePlayer(p.id)}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn" onClick={addPlayer}>
          + Add Player
        </button>
        <button className="btn btn-primary" onClick={startGame}>
          Start Game
        </button>
      </div>
    )
  }

  const scoreboard = (
    <div className="scoreboard">
      {players.map((p, i) => (
        <div key={p.id} className={`score-chip ${i === clueGiverIdx ? 'score-chip-active' : ''}`}>
          <span
            className="score-initials"
            style={{ background: INITIALS_COLORS[i % INITIALS_COLORS.length] }}
          >
            {initialsOf(p.name)}
          </span>
          <span className="score-name">{p.name}</span>
          <span className="score-value">{p.score}</span>
        </div>
      ))}
    </div>
  )

  if (phase === 'clue-pass') {
    return (
      <div className="panel stack pass-screen">
        <div className="round-tag">Round {round}</div>
        <h2>Pass the device to</h2>
        <div className="pass-name">{clueGiver.name}</div>
        <p className="dim">You're the clue-giver this round.</p>
        <button className="btn btn-primary" onClick={beginClueTurn}>
          I'm {clueGiver.name} — show me the color
        </button>
        {scoreboard}
      </div>
    )
  }

  if (phase === 'clue-reveal') {
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Your secret color — {coordToCode(target)}</h2>
          <span className="dim">Only {clueGiver.name} should look!</span>
        </div>
        <ColorBoard
          disabled
          markers={[{ coord: target, label: '★', className: 'marker-target' }]}
        />
        <div className="row">
          <input
            placeholder="Type your one-word clue..."
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && submitClue()}
          />
          <button className="btn btn-primary" onClick={submitClue} disabled={!clue.trim()}>
            Lock In Clue
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'guess-pass') {
    const guesser = guessers[guesserPointer]
    return (
      <div className="panel stack pass-screen">
        <div className="round-tag">Round {round} · Clue: "{clue}"</div>
        <h2>Pass the device to</h2>
        <div className="pass-name">{guesser.name}</div>
        <button className="btn btn-primary" onClick={beginGuessTurn}>
          I'm {guesser.name} — let me guess
        </button>
        {scoreboard}
      </div>
    )
  }

  if (phase === 'guessing') {
    const guesser = guessers[guesserPointer]
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>
            {guesser.name}, where's the clue "<span className="clue-word">{clue}</span>"?
          </h2>
        </div>
        <ColorBoard
          selected={pendingGuess}
          onCellClick={setPendingGuess}
        />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="dim">{pendingGuess ? `Selected: ${coordToCode(pendingGuess)}` : 'Click a square to guess'}</span>
          <button className="btn btn-primary" onClick={confirmGuess} disabled={!pendingGuess}>
            Confirm Guess
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'reveal' && roundScoring) {
    const markers: Marker[] = [
      { coord: target, label: '★', className: 'marker-target' },
      ...roundScoring.results
        .filter((r) => r.distance >= 0)
        .map((r, i) => ({
          coord: guesses[r.player.id],
          label: initialsOf(r.player.name),
          className: `marker-guess marker-${i % INITIALS_COLORS.length}`,
        })),
    ]
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <h2>
          The color was <strong>{coordToCode(target)}</strong> — clue was "{clue}"
        </h2>
        <ColorBoard disabled markers={markers} />
        <div className="stack">
          {roundScoring.results.map((r) => (
            <div className="row" key={r.player.id} style={{ justifyContent: 'space-between' }}>
              <span>{r.player.name}</span>
              <span className="dim">{r.distance < 0 ? 'no guess' : `${coordToCode(guesses[r.player.id])} · ${r.distance} away`}</span>
              <strong>+{r.points}</strong>
            </div>
          ))}
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{clueGiver.name} (clue-giver)</span>
            <span />
            <strong>+{roundScoring.giverPts}</strong>
          </div>
        </div>
        <button className="btn btn-primary" onClick={applyScoresAndContinue}>
          Next Round →
        </button>
        {scoreboard}
      </div>
    )
  }

  return null
}
