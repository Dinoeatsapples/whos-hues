import { useState } from 'react'
import MainMenu from './screens/MainMenu'
import LocalGame from './screens/LocalGame'
import SinglePlayerGame from './screens/SinglePlayerGame'
import OnlineGame from './screens/OnlineGame'
import HowToPlay from './screens/HowToPlay'
import './App.css'

export type Screen = 'menu' | 'local' | 'single' | 'online' | 'how-to-play'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => setScreen('menu')}>
          <span className="brand-dot" /> Who's Hues
        </button>
        {screen !== 'menu' && (
          <button className="btn btn-ghost" onClick={() => setScreen('menu')}>
            ← Main Menu
          </button>
        )}
      </header>
      <main className="app-main">
        {screen === 'menu' && <MainMenu onNavigate={setScreen} />}
        {screen === 'local' && <LocalGame />}
        {screen === 'single' && <SinglePlayerGame />}
        {screen === 'online' && <OnlineGame />}
        {screen === 'how-to-play' && <HowToPlay />}
      </main>
    </div>
  )
}

export default App
