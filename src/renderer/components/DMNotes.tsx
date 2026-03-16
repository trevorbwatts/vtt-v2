import { memo } from 'react'
import type { MapNote, MapNoteType } from '../types'
import { Swords, Info, Skull, Trash2, FileText, ChevronLeft } from 'lucide-react'

function QuoteBookIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}>
      <path d="M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64ZM160,88h40a8,8,0,0,1,0,16H160a8,8,0,0,1,0-16Zm48,40a8,8,0,0,1-8,8H160a8,8,0,0,1,0-16h40A8,8,0,0,1,208,128Zm0,32a8,8,0,0,1-8,8H160a8,8,0,0,1,0-16h40A8,8,0,0,1,208,160Z" />
    </svg>
  )
}

function TreasureChestIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256" className={className}>
      <path d="M184,40H72A56.06,56.06,0,0,0,16,96v96a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V96A56.06,56.06,0,0,0,184,40Zm40,56v8H192V56.8A40.07,40.07,0,0,1,224,96Zm-88,40H120V104h16Zm-24,16h32a8,8,0,0,0,8-8V120h24v72H80V120h24v24A8,8,0,0,0,112,152Zm40-48V96a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v8H80V56h96v48ZM64,56.8V104H32V96A40.07,40.07,0,0,1,64,56.8ZM32,120H64v72H32Zm192,72H192V120h32v72Z" />
    </svg>
  )
}

export function NoteIcon({ type, size = 16, className = '' }: { type: MapNoteType; size?: number; className?: string }) {
  switch (type) {
    case 'treasure': return <TreasureChestIcon size={size} className={`text-[var(--accent)] ${className}`} />
    case 'quote': return <QuoteBookIcon size={size} className={`text-blue-400 ${className}`} />
    case 'combat': return <Swords size={size} className={`text-[var(--accent)] ${className}`} />
    case 'info': return <Info size={size} className={`text-emerald-400 ${className}`} />
    case 'trap': return <Skull size={size} className={`text-red-500 ${className}`} />
    default: return null
  }
}

interface DMNotesProps {
  notes: MapNote[]
  onDelete: (id: string) => void
  onCollapse: () => void
}

function DMNotes({ notes, onDelete, onCollapse }: DMNotesProps) {
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

export default memo(DMNotes)
