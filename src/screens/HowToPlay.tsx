export default function HowToPlay() {
  return (
    <div className="panel stack" style={{ maxWidth: 640 }}>
      <h2>How to Play</h2>
      <ol className="stack" style={{ lineHeight: 1.6 }}>
        <li>Each round, one player is the <strong>clue-giver</strong>. They're shown a secret square on the color board and its coordinate (like "M14").</li>
        <li>The clue-giver gives <strong>one word</strong> that describes the color (e.g. "Ocean", "Mustard", "Coal").</li>
        <li>Everyone else looks at the board and picks the square they think matches the clue.</li>
        <li>The clue-giver reveals the true square. Guessers score points based on how close they were:
          <ul>
            <li><strong>3 points</strong> — exact square</li>
            <li><strong>2 points</strong> — one square away</li>
            <li><strong>1 point</strong> — two squares away</li>
          </ul>
        </li>
        <li>The clue-giver scores 1 point for every guesser who scored.</li>
        <li>Rotate the clue-giver and play another round. Most points after N rounds wins!</li>
      </ol>
    </div>
  )
}
