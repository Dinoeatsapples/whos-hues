import { useMemo } from 'react'
import { buildBoard, coordToCode, ROW_LETTERS, COLS, type Coord } from '../game/colorBoard'
import './ColorBoard.css'

export interface Marker {
  coord: Coord
  label: string
  className: string
}

interface ColorBoardProps {
  onCellClick?: (coord: Coord) => void
  selected?: Coord | null
  markers?: Marker[]
  disabled?: boolean
  dim?: boolean // dims the whole board (e.g. while waiting for others)
}

export default function ColorBoard({
  onCellClick,
  selected,
  markers = [],
  disabled = false,
  dim = false,
}: ColorBoardProps) {
  const board = useMemo(() => buildBoard(), [])

  const markerByCode = useMemo(() => {
    const map = new Map<string, Marker[]>()
    for (const m of markers) {
      const key = coordToCode(m.coord)
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return map
  }, [markers])

  return (
    <div className={`board-wrap ${dim ? 'board-dim' : ''}`}>
      <div className="board-col-headers" style={{ gridTemplateColumns: `2em repeat(${COLS}, 1fr)` }}>
        <div />
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} className="board-header-cell">
            {c + 1}
          </div>
        ))}
      </div>
      <div className="board-grid">
        {board.map((row, r) => (
          <div className="board-row" key={r} style={{ gridTemplateColumns: `2em repeat(${COLS}, 1fr)` }}>
            <div className="board-header-cell">{ROW_LETTERS[r]}</div>
            {row.map((cell) => {
              const isSelected = selected && selected.row === cell.row && selected.col === cell.col
              const cellMarkers = markerByCode.get(cell.code)
              return (
                <button
                  key={cell.code}
                  type="button"
                  className={`board-cell ${isSelected ? 'board-cell-selected' : ''}`}
                  style={{ background: cell.color }}
                  disabled={disabled}
                  title={cell.code}
                  onClick={() => onCellClick?.({ row: cell.row, col: cell.col })}
                >
                  {cellMarkers?.map((m, i) => (
                    <span key={i} className={`board-marker ${m.className}`}>
                      {m.label}
                    </span>
                  ))}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
