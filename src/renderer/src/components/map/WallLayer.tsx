import React from 'react'
import { Line, Circle } from 'react-konva'
import type { UVTTData } from '../../types/map.types'

interface WallLayerProps {
  uvttData: UVTTData
  cellSize: number
}

/**
 * Maps UVTT grid-space coordinates to canvas pixel coordinates.
 * UVTT coordinates are in grid cells (float), so we multiply by cellSize.
 */
function toPixel(v: number, cellSize: number): number {
  return v * cellSize
}

export function WallLayer({ uvttData, cellSize }: WallLayerProps): React.ReactElement {
  const { line_of_sight, portals } = uvttData

  return (
    <>
      {/* Walls */}
      {line_of_sight.map((seg, i) => (
        <Line
          key={`wall-${i}`}
          points={[
            toPixel(seg[0].x, cellSize),
            toPixel(seg[0].y, cellSize),
            toPixel(seg[1].x, cellSize),
            toPixel(seg[1].y, cellSize)
          ]}
          stroke="#ff6b35"
          strokeWidth={2}
          lineCap="round"
          globalCompositeOperation="source-over"
        />
      ))}

      {/* Portals (doors/windows) */}
      {portals.map((portal, i) => {
        const x1 = toPixel(portal.bounds[0].x, cellSize)
        const y1 = toPixel(portal.bounds[0].y, cellSize)
        const x2 = toPixel(portal.bounds[1].x, cellSize)
        const y2 = toPixel(portal.bounds[1].y, cellSize)
        const px = toPixel(portal.position.x, cellSize)
        const py = toPixel(portal.position.y, cellSize)
        const color = portal.closed ? '#4ade80' : '#facc15'
        return (
          <React.Fragment key={`portal-${i}`}>
            <Line
              points={[x1, y1, x2, y2]}
              stroke={color}
              strokeWidth={3}
              lineCap="round"
            />
            {/* Door handle indicator */}
            <Circle x={px} y={py} radius={4} fill={color} />
          </React.Fragment>
        )
      })}
    </>
  )
}
