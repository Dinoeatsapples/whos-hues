import type { Screen } from '../App'
import './MainMenu.css'

interface MainMenuProps {
  onNavigate: (screen: Screen) => void
}

export default function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="menu-wrap">
      <h1 className="menu-title">
        Who's <span className="menu-title-accent">Hues</span>
      </h1>
      <p className="menu-subtitle">
        Someone sees a secret color and gives a one-word clue. Everyone else guesses where on
        the board it is. Closest guesses win the round!
      </p>

      <div className="menu-cards">
        <button className="menu-card menu-card-a" onClick={() => onNavigate('local')}>
          <div className="menu-card-icon">🎉</div>
          <div className="menu-card-title">Pass &amp; Play</div>
          <div className="menu-card-desc">One device, everyone takes turns being the clue-giver.</div>
        </button>

        <button className="menu-card menu-card-b" onClick={() => onNavigate('online')}>
          <div className="menu-card-icon">🌐</div>
          <div className="menu-card-title">Online Multiplayer</div>
          <div className="menu-card-desc">Create or join a room and play together from separate devices.</div>
        </button>

        <button className="menu-card menu-card-c" onClick={() => onNavigate('single')}>
          <div className="menu-card-icon">🤖</div>
          <div className="menu-card-title">Solo Practice</div>
          <div className="menu-card-desc">The AI picks a color and gives you a clue. How close can you get?</div>
        </button>
      </div>

      <button className="btn btn-ghost how-to-link" onClick={() => onNavigate('how-to-play')}>
        How to play →
      </button>
    </div>
  )
}
