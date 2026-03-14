import React, { useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { useMapStore, useSelectedToken } from '../../store/map.store'
import { useUIStore } from '../../store/ui.store'
import { MapImageNode } from './MapLayer'
import { WallLayer } from './WallLayer'
import { GridLayer } from './GridLayer'
import { TokenNode } from './TokenNode'
import { NoteNode } from './NoteNode'
import type { TokenInstance, MapNote } from '../../types/map.types'

interface MapCanvasProps {
  width: number
  height: number
  imageUrl: string | null
  zoom: number
  onImageSize?: (width: number, height: number) => void
}

export function MapCanvas({ width, height, imageUrl, zoom, onImageSize }: MapCanvasProps): React.ReactElement {
  const stageRef = useRef<Konva.Stage>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const { mapData, setSelectedToken } = useMapStore()
  const selectedToken = useSelectedToken()
  const { showContextMenu, hideContextMenu } = useUIStore()

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>): void {
    e.evt.preventDefault()
    // Two-finger trackpad scroll (no Ctrl) = pan
    setPosition((p) => ({
      x: p.x - e.evt.deltaX,
      y: p.y - e.evt.deltaY
    }))
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>): void {
    if (e.target === e.currentTarget || e.target.getClassName() === 'Image') {
      if (e.target.getParent()?.getClassName() !== 'Group') {
        setSelectedToken(null)
      }
    }
    hideContextMenu()
  }

  function handleStageContextMenu(e: Konva.KonvaEventObject<PointerEvent>): void {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mapX = (pointer.x - position.x) / zoom
    const mapY = (pointer.y - position.y) / zoom

    showContextMenu(e.evt.clientX, e.evt.clientY, mapX, mapY)
  }

  function handleTokenContextMenu(token: TokenInstance, screenX: number, screenY: number): void {
    const mapX = (screenX - position.x) / zoom
    const mapY = (screenY - position.y) / zoom
    showContextMenu(screenX, screenY, mapX, mapY, token.id)
  }

  function handleNoteClick(note: MapNote): void {
    useUIStore.getState().openNoteEditor(note.id)
  }

  if (!mapData || !imageUrl) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">No map loaded</p>
      </div>
    )
  }

  const { gridConfig, uvttData, tokens, notes, mode } = mapData

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={position.x}
      y={position.y}
      draggable={false}
      onWheel={handleWheel}
      onClick={handleStageClick}
      onContextMenu={handleStageContextMenu}
    >
      {/* Layer 1: Map image */}
      <Layer listening={false}>
        <MapImageNode imageUrl={imageUrl} onImageSize={onImageSize} />
      </Layer>

      {/* Layer 2: Grid */}
      <Layer listening={false}>
        <GridLayer
          gridConfig={gridConfig}
          mapWidth={10000}
          mapHeight={10000}
        />
      </Layer>

      {/* Layer 3: Walls (UVTT) */}
      {uvttData && (
        <Layer listening={false}>
          <WallLayer uvttData={uvttData} cellSize={gridConfig.cellSize} />
        </Layer>
      )}

      {/* Layer 4: Notes (DM only in setup mode) */}
      {mode === 'setup' && (
        <Layer>
          {notes
            .filter((n) => n.visibility === 'dm' ? mode === 'setup' : true)
            .map((note) => (
              <NoteNode key={note.id} note={note} onClick={handleNoteClick} />
            ))}
        </Layer>
      )}

      {/* Layer 5: Tokens */}
      <Layer>
        {tokens.map((token) => (
          <TokenNode
            key={token.id}
            token={token}
            gridConfig={gridConfig}
            isSelected={selectedToken?.id === token.id}
            onSelect={setSelectedToken}
            onContextMenu={handleTokenContextMenu}
          />
        ))}
      </Layer>

      {/* Layer 6: Fog placeholder */}
      <Layer listening={false}>
        {/* Fog of war — Phase 2 */}
      </Layer>
    </Stage>
  )
}
