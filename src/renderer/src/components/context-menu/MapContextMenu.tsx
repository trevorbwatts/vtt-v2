import React, { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/ui.store'

interface MapContextMenuProps {
  /** Called when "Add Monster" is clicked */
  onAddMonster: () => void
}

export function MapContextMenu({ onAddMonster }: MapContextMenuProps): React.ReactElement | null {
  const { contextMenu, hideContextMenu, openNoteEditor, openAddPlayers } = useUIStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(): void {
      if (contextMenu.visible) hideContextMenu()
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [contextMenu.visible, hideContextMenu])

  if (!contextMenu.visible || contextMenu.targetTokenId !== null) return null

  const { x, y, mapX, mapY } = contextMenu

  // Clamp position so menu stays on screen
  const menuW = 200
  const menuH = 140
  const clampedX = Math.min(x, window.innerWidth - menuW - 8)
  const clampedY = Math.min(y, window.innerHeight - menuH - 8)

  function handleAddPlayers(): void {
    hideContextMenu()
    openAddPlayers()
  }

  function handleAddNote(): void {
    hideContextMenu()
    openNoteEditor(undefined, { x: mapX, y: mapY })
  }

  const items = [
    { label: '📌 Add Note', action: handleAddNote },
    { label: '👥 Add/Move Players', action: handleAddPlayers },
    { label: '👹 Add Monster', action: () => { hideContextMenu(); onAddMonster() } }
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-lg overflow-hidden shadow-2xl"
      style={{
        left: clampedX,
        top: clampedY,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        minWidth: menuW
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors"
          style={{ color: 'var(--text-primary)' }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
