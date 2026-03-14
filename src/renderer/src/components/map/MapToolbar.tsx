import React from 'react'
import { useMapStore } from '../../store/map.store'
import type { MapMode } from '../../types/map.types'

interface MapToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFitToScreen?: () => void
}

export function MapToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen
}: MapToolbarProps): React.ReactElement {
  const { mapData, setMode, isDirty, saveMap } = useMapStore()
  const mode: MapMode = mapData?.mode ?? 'setup'

  const btnBase = {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: 6,
    cursor: 'pointer'
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      {/* Mode toggle */}
      <div
        className="flex rounded overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {(['setup', 'play'] as MapMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
            style={{
              backgroundColor: mode === m ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: mode === m ? '#fff' : 'var(--text-muted)'
            }}
          >
            {m === 'setup' ? '⚙️ Setup' : '▶ Play'}
          </button>
        ))}
      </div>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border)' }} />

      {/* Zoom controls */}
      <button onClick={onZoomOut} className="px-2 py-1 text-sm" style={btnBase} title="Zoom Out">
        −
      </button>
      <button
        onClick={onZoomReset}
        className="px-2 py-1 text-xs min-w-[52px] text-center"
        style={btnBase}
        title="Reset Zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={onZoomIn} className="px-2 py-1 text-sm" style={btnBase} title="Zoom In">
        +
      </button>
      {onFitToScreen && (
        <button onClick={onFitToScreen} className="px-2 py-1 text-xs" style={btnBase} title="Fit to Screen (F)">
          ⤢
        </button>
      )}

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border)' }} />

      {/* Map name */}
      {mapData && (
        <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {mapData.name}
          {mapData.format !== 'image' && (
            <span
              className="ml-1.5 px-1 py-0.5 rounded text-xs uppercase"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 10 }}
            >
              {mapData.format}
            </span>
          )}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {isDirty && (
          <button
            onClick={() => saveMap()}
            className="text-xs px-2.5 py-1 rounded"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Save
          </button>
        )}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {mapData?.tokens.length ?? 0} tokens · {mapData?.notes.length ?? 0} notes
        </span>
      </div>
    </div>
  )
}
