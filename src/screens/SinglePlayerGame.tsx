import { useState } from 'react'
import ColorBoard, { type Marker } from '../components/ColorBoard'
import { coordToCode, hslForCell, scoreGuess, type Coord } from '../game/colorBoard'
import { generateClue, pickAiTarget } from '../game/aiClueGiver'
import './SinglePlayerGame.css'

type Phase = 'intro' | 'guessing' | 'reveal'

const TOTAL_ROUNDS = 8

export default function SinglePlayerGame() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [target, setTarget] = useState<Coord | null>(null)
  const [clue, setClue] = useState('')
  const [pendingGuess, setPendingGuess] = useState<Coord | null>(null)
  const [lastResult, setLastResult] = useState<{ distance: number; points: number } | null>(null)

  function startRound() {
    const t = pickAiTarget()
    const { h, s, l } = hslForCell(t.row, t.col)
    setTarget(t)
    setClue(generateClue(h, s, l))
    setPendingGuess(null)
    setPhase('guessing')
    setRound((r) => r + 1)
  }

  function submitGuess() {
    if (!pendingGuess || !target) return
    const { distance, points } = scoreGuess(target, pendingGuess)
    setLastResult({ distance, points })
    setTotalScore((s) => s + points)
    setPhase('reveal')
  }

  if (phase === 'intro') {
    const isDone = round >= TOTAL_ROUNDS && round > 0
    return (
      <div className="panel stack" style={{ maxWidth: 480, textAlign: 'center' }}>
        <h2>Solo Practice</h2>
        {round === 0 ? (
          <p className="dim">
            The AI will secretly pick a color and give you a one-word clue. Guess where it is on
            the board — the closer you are, the more points you score!
          </p>
        ) : isDone ? (
          <>
            <p>
              Practice complete! Final score: <strong>{totalScore}</strong> / {TOTAL_ROUNDS * 3}
            </p>
            <button
              className="btn"
              onClick={() => {
                setRound(0)
                setTotalScore(0)
              }}
            >
              Reset
            </button>
          </>
        ) : (
          <p className="dim">
            Round {round} of {TOTAL_ROUNDS} complete. Score so far: <strong>{totalScore}</strong>
          </p>
        )}
        {!isDone && (
          <button className="btn btn-primary" onClick={startRound}>
            {round === 0 ? 'Start' : 'Next Round'} →
          </button>
        )}
      </div>
    )
  }

  if (phase === 'guessing' && target) {
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>
            Round {round}/{TOTAL_ROUNDS} — Clue: <span className="clue-word">"{clue}"</span>
          </h2>
          <span className="dim">Score: {totalScore}</span>
        </div>
        <ColorBoard selected={pendingGuess} onCellClick={setPendingGuess} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="dim">{pendingGuess ? `Selected: ${coordToCode(pendingGuess)}` : 'Click a square to guess'}</span>
          <button className="btn btn-primary" onClick={submitGuess} disabled={!pendingGuess}>
            Submit Guess
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'reveal' && target && lastResult && pendingGuess) {
    const markers: Marker[] = [
      { coord: target, label: '★', className: 'marker-target' },
      { coord: pendingGuess, label: 'YOU', className: 'marker-guess' },
    ]
    return (
      <div className="panel stack" style={{ width: '100%', maxWidth: 900 }}>
        <h2>
          The color was <strong>{coordToCode(target)}</strong> — you said "{clue}" and guessed{' '}
          {coordToCode(pendingGuess)}
        </h2>
        <ColorBoard disabled markers={markers} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="dim">
            {lastResult.distance === 0 ? 'Bullseye!' : `${lastResult.distance} square(s) away`}
          </span>
          <strong>+{lastResult.points} points (total {totalScore})</strong>
        </div>
        <button className="btn btn-primary" onClick={() => setPhase('intro')}>
          Continue →
        </button>
      </div>
    )
  }

  return null
}
