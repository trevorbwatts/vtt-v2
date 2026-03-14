import React, { useMemo } from 'react'
import { Line } from 'react-konva'
import type { GridConfig } from '../../types/map.types'

interface GridLayerProps {
  gridConfig: GridConfig
  mapWidth: number
  mapHeight: number
}

export function GridLayer({ gridConfig, mapWidth, mapHeight }: GridLayerProps): React.ReactElement | null {
  if (!gridConfig.visible || mapWidth === 0 || mapHeight === 0) return null

  const { cellSize, offsetX, offsetY, color } = gridConfig

  const lines = useMemo(() => {
    const result: React.ReactElement[] = []
    const cols = Math.ceil((mapWidth - offsetX) / cellSize) + 1
    const rows = Math.ceil((mapHeight - offsetY) / cellSize) + 1

    for (let c = 0; c <= cols; c++) {
      const x = offsetX + c * cellSize
      result.push(
        <Line
          key={`v-${c}`}
          points={[x, 0, x, mapHeight]}
          stroke={color}
          strokeWidth={0.5}
          listening={false}
        />
      )
    }
    for (let r = 0; r <= rows; r++) {
      const y = offsetY + r * cellSize
      result.push(
        <Line
          key={`h-${r}`}
          points={[0, y, mapWidth, y]}
          stroke={color}
          strokeWidth={0.5}
          listening={false}
        />
      )
    }
    return result
  }, [cellSize, offsetX, offsetY, color, mapWidth, mapHeight])

  return <>{lines}</>
}
