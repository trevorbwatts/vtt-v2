import React from 'react'
import { Group, Circle, Text } from 'react-konva'
import type { MapNote } from '../../types/map.types'

interface NoteNodeProps {
  note: MapNote
  onClick: (note: MapNote) => void
}

const NOTE_ICONS: Record<string, string> = {
  note: '📝',
  treasure: '💎',
  quote: '💬',
  danger: '⚠️',
  location: '📍',
  quest: '❗'
}

const NOTE_COLORS: Record<string, string> = {
  note: '#7c3aed',
  treasure: '#d97706',
  quote: '#0891b2',
  danger: '#dc2626',
  location: '#059669',
  quest: '#db2777'
}

export function NoteNode({ note, onClick }: NoteNodeProps): React.ReactElement {
  const color = note.color ?? NOTE_COLORS[note.icon] ?? '#7c3aed'
  const icon = NOTE_ICONS[note.icon] ?? '📝'

  return (
    <Group
      x={note.x}
      y={note.y}
      onClick={() => onClick(note)}
      onTap={() => onClick(note)}
      style={{ cursor: 'pointer' }}
    >
      <Circle radius={14} fill={color} opacity={0.9} />
      <Text
        text={icon}
        fontSize={14}
        x={-10}
        y={-9}
        listening={false}
      />
    </Group>
  )
}
