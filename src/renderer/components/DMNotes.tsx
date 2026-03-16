import type { MapNote, MapNoteType } from '../types'
import { Package, MessageSquareQuote, Swords, Info, Skull, Trash2, FileText, ChevronLeft } from 'lucide-react'

export function NoteIcon({ type, size = 16, className = '' }: { type: MapNoteType; size?: number; className?: string }) {
  switch (type) {
    case 'treasure': return <Package size={size} className={`text-[var(--accent)] ${className}`} />
    case 'quote': return <MessageSquareQuote size={size} className={`text-blue-400 ${className}`} />
    case 'combat': return <Swords size={size} className={`text-[var(--accent)] ${className}`} />
    case 'info': return <Info size={size} className={`text-emerald-400 ${className}`} />
    case 'trap': return <Skull size={size} className={`text-purple-400 ${className}`} />
    default: return null
  }
}

interface DMNotesProps {
  notes: MapNote[]
  onDelete: (id: string) => void
  onCollapse: () => void
}

export default function DMNotes({ notes, onDelete, onCollapse }: DMNotesProps) {
  return (
    <div className="h-full flex flex-col bg-transparent relative z-10">
      <div className="h-10 px-3 border-b border-[var(--line)] bg-black/5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={12} className="opacity-50" />
          <h3 className="text-[10px] uppercase tracking-widest opacity-50 font-sans font-bold">Notes</h3>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 hover:bg-black/10 rounded transition-colors opacity-50 hover:opacity-100"
          title="Collapse Notes"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-4">
            <Info size={32} className="mb-2" />
            <p className="text-xs font-sans uppercase tracking-widest">No map notes yet</p>
            <p className="text-[10px] mt-1">Right-click on the map to add a note</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group p-3 rounded border border-[var(--line)] bg-[var(--surface-hover)] hover:border-[var(--accent)] transition-all relative"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <NoteIcon type={note.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--ink)] whitespace-pre-wrap break-words leading-relaxed font-serif italic">
                    {note.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[8px] font-sans opacity-30 uppercase tracking-tighter">
                      POS: {Math.round(note.x)}, {Math.round(note.y)}
                    </span>
                    <button
                      onClick={() => onDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--accent)]/10 rounded text-[var(--accent)] transition-all"
                      title="Remove Note"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
