import type { Screen } from '../App'
import './MainMenu.css'

interface MainMenuProps {
  onNavigate: (screen: Screen) => void
}

export default function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="menu-wrap">
      <div className="logo-plate">
        <div className="logo-line-1">WHO'S</div>
        <div className="logo-line-2">HUES</div>
        <div className="logo-sub">A GUESSING GAME OF COLORS AND CLUES</div>
      </div>
      <p className="menu-subtitle">
        Someone sees a secret color and gives a one-word clue. Everyone else guesses where on
        the board it is. Closest guesses win the round.
      </p>

      <div className="mode-list">
        <button className="mode-row" onClick={() => onNavigate('local')}>
          <span className="mode-index">01</span>
          <span className="mode-swatch mode-swatch-chess" aria-hidden="true">
            <span className="chess-half chess-half-white">♚</span>
            <span className="chess-half chess-half-black">♔</span>
          </span>
          <span className="mode-copy">
            <span className="mode-title">Pass &amp; Play</span>
            <span className="mode-desc">One device, everyone takes turns being the clue-giver.</span>
          </span>
          <span className="mode-arrow">→</span>
        </button>

        <button className="mode-row" onClick={() => onNavigate('online')}>
          <span className="mode-index">02</span>
          <span className="mode-swatch mode-swatch-wifi" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M2 8.5a15 15 0 0 1 20 0" />
              <path d="M5 12.5a10.5 10.5 0 0 1 14 0" />
              <path d="M8.5 16.5a5.5 5.5 0 0 1 7 0" />
              <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="mode-copy">
            <span className="mode-title">Online Multiplayer</span>
            <span className="mode-desc">Create or join a room and play together from separate devices.</span>
          </span>
          <span className="mode-arrow">→</span>
        </button>

        <button className="mode-row" onClick={() => onNavigate('single')}>
          <span className="mode-index">03</span>
          <span className="mode-swatch mode-swatch-target" aria-hidden="true" />
          <span className="mode-copy">
            <span className="mode-title">Solo Practice</span>
            <span className="mode-desc">A computer opponent picks a color and gives you a clue.</span>
          </span>
          <span className="mode-arrow">→</span>
        </button>
      </div>

      <button className="how-to-link" onClick={() => onNavigate('how-to-play')}>
        How to play <span className="how-to-arrow">→</span>
      </button>
    </div>
  )
}
