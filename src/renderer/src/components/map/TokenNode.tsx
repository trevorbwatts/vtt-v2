import React, { useRef, useState, useEffect } from 'react'
import { Group, Circle, Text, Image, Rect } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { TokenInstance, GridConfig } from '../../types/map.types'
import { useMapStore } from '../../store/map.store'

interface TokenNodeProps {
  token: TokenInstance
  gridConfig: GridConfig
  isSelected: boolean
  onSelect: (id: string) => void
  onContextMenu: (token: TokenInstance, x: number, y: number) => void
}

const TOKEN_COLORS: Record<string, string> = {
  player: '#7c3aed',
  monster: '#dc2626',
  npc: '#0891b2'
}

function TokenImageNode({
  imageUrl,
  size
}: {
  imageUrl: string
  size: number
}): React.ReactElement | null {
  const [img] = useImage(imageUrl)
  if (!img) return null
  return (
    <Image
      image={img}
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
      cornerRadius={size / 2}
      listening={false}
    />
  )
}

export function TokenNode({
  token,
  gridConfig,
  isSelected,
  onSelect,
  onContextMenu
}: TokenNodeProps): React.ReactElement {
  const { moveToken } = useMapStore()
  const groupRef = useRef<Konva.Group>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { cellSize, offsetX, offsetY, snapToGrid } = gridConfig
  const radius = (token.sizeInCells * cellSize) / 2
  const ringColor = TOKEN_COLORS[token.type] ?? '#888'
  const hpPct = token.maxHp && token.maxHp > 0 ? (token.currentHp ?? token.maxHp) / token.maxHp : 1
  const hpColor = hpPct > 0.5 ? '#4ade80' : hpPct > 0.25 ? '#facc15' : '#f87171'

  useEffect(() => {
    if (token.tokenImagePath) {
      window.api.map.getImageUrl(token.tokenImagePath).then(setImageUrl).catch(() => setImageUrl(null))
    }
  }, [token.tokenImagePath])

  function snapToCell(val: number, offset: number): number {
    return Math.round((val - offset) / cellSize) * cellSize + offset
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>): void {
    let x = e.target.x()
    let y = e.target.y()
    if (snapToGrid) {
      x = snapToCell(x, offsetX + radius)
      y = snapToCell(y, offsetY + radius)
      e.target.x(x)
      e.target.y(y)
    }
    moveToken(token.id, x, y)
  }

  return (
    <Group
      ref={groupRef}
      x={token.x}
      y={token.y}
      draggable
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(token.id)}
      onTap={() => onSelect(token.id)}
      onContextMenu={(e) => {
        e.evt.preventDefault()
        const stage = e.target.getStage()
        if (!stage) return
        const pos = stage.getPointerPosition()
        if (pos) onContextMenu(token, pos.x, pos.y)
      }}
    >
      {/* Token background */}
      <Circle radius={radius} fill="#1a1a2e" stroke={ringColor} strokeWidth={isSelected ? 3 : 2} />

      {/* Token image or initial */}
      {imageUrl ? (
        <TokenImageNode imageUrl={imageUrl} size={radius * 2 - 4} />
      ) : (
        <Text
          text={token.name[0]?.toUpperCase() ?? '?'}
          fontSize={radius * 0.8}
          fontStyle="bold"
          fill={ringColor}
          x={-radius}
          y={-radius * 0.45}
          width={radius * 2}
          align="center"
          listening={false}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <Circle
          radius={radius + 5}
          stroke="#fff"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      )}

      {/* HP bar (shown when damaged) */}
      {token.maxHp && token.maxHp > 0 && hpPct < 1 && (
        <>
          <Rect
            x={-radius}
            y={radius + 3}
            width={radius * 2}
            height={4}
            fill="#374151"
            cornerRadius={2}
            listening={false}
          />
          <Rect
            x={-radius}
            y={radius + 3}
            width={radius * 2 * hpPct}
            height={4}
            fill={hpColor}
            cornerRadius={2}
            listening={false}
          />
        </>
      )}

      {/* Name label */}
      <Text
        text={token.name}
        fontSize={10}
        fill="#e6edf3"
        x={-radius * 2}
        y={radius + (token.maxHp ? 10 : 5)}
        width={radius * 4}
        align="center"
        listening={false}
      />
    </Group>
  )
}
