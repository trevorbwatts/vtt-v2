import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useMapStore } from '../store/map.store'
import { useUIStore } from '../store/ui.store'
import { MapCanvas } from '../components/map/MapCanvas'
import { MapToolbar } from '../components/map/MapToolbar'
import { TokenPanel } from '../components/token/TokenPanel'
import { MapContextMenu } from '../components/context-menu/MapContextMenu'
import { TokenContextMenu } from '../components/context-menu/TokenContextMenu'
import { BestiaryModal } from '../components/bestiary/BestiaryModal'
import { NoteEditor } from '../components/map/NoteEditor'
import { AddPlayersModal } from '../components/map/AddPlayersModal'

export function MapPage(): React.ReactElement {
  const { mapData, setSelectedToken, removeToken, updateMap } = useMapStore()
  const { openBestiary, hideContextMenu } = useUIStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [zoom, setZoom] = useState(1)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Resolve file:// URL for the map image
  useEffect(() => {
    if (!mapData?.imagePath) {
      setImageUrl(null)
      return
    }
    window.api.map
      .getImageUrl(mapData.imagePath)
      .then(setImageUrl)
      .catch(() => setImageUrl(null))
  }, [mapData?.imagePath])

  // Observe canvas container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function fitToScreen(): void {
    if (!imageDimensions) return
    const newZoom = Math.min(
      canvasSize.width / imageDimensions.width,
      canvasSize.height / imageDimensions.height
    )
    setZoom(Math.max(0.05, Math.min(5, newZoom)))
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      // Don't fire when typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedTokenId } = useMapStore.getState()
        if (selectedTokenId) {
          removeToken(selectedTokenId)
        }
      } else if (e.key === 'Escape') {
        setSelectedToken(null)
        hideContextMenu()
      } else if (e.key === 'g' || e.key === 'G') {
        const { mapData: md } = useMapStore.getState()
        if (md) {
          updateMap({ gridConfig: { ...md.gridConfig, visible: !md.gridConfig.visible } })
        }
      } else if (e.key === 'f' || e.key === 'F') {
        fitToScreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvasSize, imageDimensions, removeToken, setSelectedToken, hideContextMenu])

  const handleImageSize = useCallback((w: number, h: number) => {
    setImageDimensions({ width: w, height: h })
  }, [])

  if (!mapData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-muted)' }}>
        <div className="text-5xl">🗺️</div>
        <p className="text-sm">No map open — select a map from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <MapToolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(5, z * 1.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z / 1.2))}
        onZoomReset={() => setZoom(1)}
        onFitToScreen={fitToScreen}
      />

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative" style={{ backgroundColor: '#0a0a14' }}>
        <MapCanvas
          width={canvasSize.width}
          height={canvasSize.height}
          imageUrl={imageUrl}
          zoom={zoom}
          onImageSize={handleImageSize}
        />

        {/* Context menus (positioned fixed) */}
        <MapContextMenu onAddMonster={openBestiary} />
        <TokenContextMenu />
      </div>

      {/* Token bottom panel */}
      <TokenPanel />

      {/* Modals */}
      <BestiaryModal />
      <NoteEditor />
      <AddPlayersModal />
    </div>
  )
}
