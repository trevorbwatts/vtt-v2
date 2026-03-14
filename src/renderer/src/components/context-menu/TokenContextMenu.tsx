import React, { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/ui.store'
import { useMapStore } from '../../store/map.store'

export function TokenContextMenu(): React.ReactElement | null {
  const { contextMenu, hideContextMenu } = useUIStore()
  const { removeToken, updateToken, mapData } = useMapStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(): void {
      if (contextMenu.visible) hideContextMenu()
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [contextMenu.visible, hideContextMenu])

  if (!contextMenu.visible || !contextMenu.targetTokenId) return null

  const tokenId = contextMenu.targetTokenId
  const token = mapData?.tokens.find((t) => t.id === tokenId)
  if (!token) return null

  const { x, y } = contextMenu
  const menuW = 200
  const menuH = 200
  const clampedX = Math.min(x, window.innerWidth - menuW - 8)
  const clampedY = Math.min(y, window.innerHeight - menuH - 8)

  function handleEditHp(): void {
    if (!token) return
    const val = prompt(`Current HP for ${token.name} (max: ${token.maxHp ?? '?'}):`, String(token.currentHp ?? ''))
    if (val === null) return
    const hp = parseInt(val, 10)
    if (!isNaN(hp)) updateToken(tokenId, { currentHp: hp })
    hideContextMenu()
  }

  function handleToggleVisible(): void {
    updateToken(tokenId, { visible: !token?.visible })
    hideContextMenu()
  }

  function handleRemove(): void {
    removeToken(tokenId)
    hideContextMenu()
  }

  const items = [
    { label: '❤️ Edit HP', action: handleEditHp },
    {
      label: token.visible ? '👁️ Hide Token' : '👁️ Show Token',
      action: handleToggleVisible
    },
    { label: '🗑️ Remove Token', action: handleRemove, danger: true }
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
      <div className="px-4 py-2 text-xs font-semibold" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
        {token.name}
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors"
          style={{ color: item.danger ? 'var(--danger)' : 'var(--text-primary)' }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
