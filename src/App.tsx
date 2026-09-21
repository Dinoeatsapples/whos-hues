import { useEffect, useRef, useState } from 'react'
import MainMenu from './screens/MainMenu'
import LocalGame from './screens/LocalGame'
import SinglePlayerGame from './screens/SinglePlayerGame'
import OnlineGame from './screens/OnlineGame'
import HowToPlay from './screens/HowToPlay'
import bgMusicUrl from './assets/audio/bg-music.mp3'
import './App.css'

export type Screen = 'menu' | 'local' | 'single' | 'online' | 'how-to-play'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [musicOn, setMusicOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.35
    // Try to autoplay; most browsers will block this until a user gesture happens.
    audio
      .play()
      .then(() => setMusicOn(true))
      .catch(() => setMusicOn(false))
  }, [])

  function toggleMusic() {
    const audio = audioRef.current
    if (!audio) return
    if (musicOn) {
      audio.pause()
      setMusicOn(false)
    } else {
      audio.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false))
    }
  }

  return (
    <div className="app-shell">
      <audio ref={audioRef} src={bgMusicUrl} loop preload="auto" />
      <header className="app-header">
        <button className="brand" onClick={() => setScreen('menu')}>
          <span className="brand-dot">
            <span />
            <span />
            <span />
            <span />
          </span>
          Who's Hues
        </button>
        <div className="header-actions">
          <button
            className={`music-toggle ${musicOn ? 'is-on' : ''}`}
            onClick={toggleMusic}
            title={musicOn ? 'Mute music' : 'Play music'}
            aria-pressed={musicOn}
          >
            {musicOn ? (
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                <path d="M4 9v6h4l5 5V4L8 9H4z" />
                <path d="M16.5 8.5a4.5 4.5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M19 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                <path d="M4 9v6h4l5 5V4L8 9H4z" />
                <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {screen !== 'menu' && (
            <button className="btn btn-ghost" onClick={() => setScreen('menu')}>
              ← Main Menu
            </button>
          )}
        </div>
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
