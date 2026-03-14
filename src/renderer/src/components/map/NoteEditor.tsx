import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { useUIStore } from '../../store/ui.store'
import { useMapStore } from '../../store/map.store'
import type { NoteIcon, NoteVisibility } from '../../types/map.types'

const NOTE_ICONS: { icon: NoteIcon; emoji: string; label: string }[] = [
  { icon: 'note', emoji: '📝', label: 'Note' },
  { icon: 'treasure', emoji: '💎', label: 'Treasure' },
  { icon: 'quote', emoji: '💬', label: 'Read-aloud' },
  { icon: 'danger', emoji: '⚠️', label: 'Danger' },
  { icon: 'location', emoji: '📍', label: 'Location' },
  { icon: 'quest', emoji: '❗', label: 'Quest' }
]

export function NoteEditor(): React.ReactElement | null {
  const { noteEditorOpen, editingNoteId, pendingNotePosition, closeNoteEditor } = useUIStore()
  const { mapData, addNote, updateNote, removeNote } = useMapStore()

  const existingNote = editingNoteId
    ? mapData?.notes.find((n) => n.id === editingNoteId)
    : undefined

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState<NoteIcon>('note')
  const [visibility, setVisibility] = useState<NoteVisibility>('dm')

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title)
      setContent(existingNote.content)
      setIcon(existingNote.icon)
      setVisibility(existingNote.visibility)
    } else {
      setTitle('')
      setContent('')
      setIcon('note')
      setVisibility('dm')
    }
  }, [editingNoteId, noteEditorOpen])

  function handleSave(): void {
    if (!title.trim()) return
    if (existingNote) {
      updateNote(existingNote.id, { title: title.trim(), content, icon, visibility })
    } else if (pendingNotePosition) {
      addNote({
        x: pendingNotePosition.x,
        y: pendingNotePosition.y,
        title: title.trim(),
        content,
        icon,
        visibility
      })
    }
    closeNoteEditor()
  }

  function handleDelete(): void {
    if (existingNote) removeNote(existingNote.id)
    closeNoteEditor()
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)'
  }

  return (
    <Modal
      open={noteEditorOpen}
      onClose={closeNoteEditor}
      title={existingNote ? 'Edit Note' : 'Add Note'}
      width="max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* Icon picker */}
        <div>
          <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            Note Type
          </label>
          <div className="flex gap-2 flex-wrap">
            {NOTE_ICONS.map(({ icon: ic, emoji, label }) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                title={label}
                className="flex flex-col items-center gap-1 p-2 rounded text-xs transition-colors"
                style={{
                  backgroundColor: icon === ic ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                  border: `1px solid ${icon === ic ? 'var(--accent)' : 'var(--border)'}`,
                  color: icon === ic ? '#a78bfa' : 'var(--text-muted)',
                  minWidth: 52
                }}
              >
                <span className="text-lg">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            autoFocus
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content..."
            rows={4}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Visibility</label>
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {([['dm', '🔒 DM Only'], ['shared', '👁️ Shared']] as [NoteVisibility, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className="flex-1 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: visibility === v ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: visibility === v ? '#fff' : 'var(--text-muted)'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 justify-between pt-1">
          {existingNote && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded text-sm"
              style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
            >
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={closeNoteEditor}
              className="px-4 py-2 rounded text-sm"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: !title.trim() ? 0.6 : 1 }}
            >
              {existingNote ? 'Save' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
