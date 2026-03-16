import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, User, Shield, Eye, Link as LinkIcon, Download, Edit2 } from 'lucide-react'
import type { Combatant } from '../types'

interface AddCombatantModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (combatant: Partial<Combatant>) => void
  type: 'player' | 'npc'
}

type Step = 'choice' | 'manual' | 'import'

export default function AddCombatantModal({ isOpen, onClose, onAdd, type }: AddCombatantModalProps) {
  const [step, setStep] = useState<Step>('choice')
  const [name, setName] = useState('')
  const [ac, setAc] = useState(10)
  const [darkvision, setDarkvision] = useState(0)
  const [url, setUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const handleManualAdd = () => {
    if (!name.trim()) return
    onAdd({
      name, hp: 10, maxHp: 10, ac, initiative: 0, type,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: [], darkvision
    })
    resetAndClose()
  }

  const handleImport = async () => {
    if (!url.trim()) return
    setIsImporting(true)
    try {
      const result = await window.api.dndbeyond.fetchCharacter(url) as { success: boolean; data?: any; error?: string }
      if (result.success && result.data) {
        onAdd({
          ...result.data,
          type,
          dndBeyondId: result.data.dndBeyondId
        })
        resetAndClose()
      } else if (result.error === 'CHARACTER_PRIVATE') {
        alert('Character is private or not found.')
      } else {
        alert('Failed to import from D&D Beyond.')
      }
    } catch {
      alert('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const resetAndClose = () => {
    setStep('choice')
    setName('')
    setAc(10)
    setDarkvision(0)
    setUrl('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--line)] bg-black/10">
            <h2 className="text-xl font-serif font-bold tracking-tight">
              Add {type === 'player' ? 'Player' : 'NPC'}
            </h2>
            <button onClick={resetAndClose} className="p-2 hover:bg-black/5 rounded-full transition-colors opacity-50 hover:opacity-100">
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            {step === 'choice' && (
              <div className="space-y-8 text-center">
                <h3 className="text-2xl font-serif font-bold tracking-tight">
                  How do you want to add this {type === 'player' ? 'Player' : 'NPC'}?
                </h3>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setStep('manual')}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[var(--accent)] text-white rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20">
                    <Edit2 size={20} /><span>Manually</span>
                  </button>
                  <button onClick={() => setStep('import')}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#E9BE59] text-black rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[#E9BE59]/20">
                    <Download size={20} /><span>Import from D&D Beyond</span>
                  </button>
                </div>
              </div>
            )}

            {step === 'manual' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40"><User size={12} /> Name</label>
                  <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character Name"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                    className="w-full bg-black border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40"><Shield size={12} /> AC</label>
                    <input type="number" value={ac} onChange={(e) => setAc(parseInt(e.target.value) || 0)}
                      className="w-full bg-black border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40"><Eye size={12} /> Darkvision</label>
                    <input type="number" value={darkvision} onChange={(e) => setDarkvision(parseInt(e.target.value) || 0)}
                      className="w-full bg-black border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button onClick={() => setStep('choice')} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Cancel</button>
                  <button disabled={!name.trim()} onClick={handleManualAdd}
                    className="px-8 py-3 bg-[var(--btn-bg)] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-30 transition-all shadow-lg shadow-[var(--btn-bg)]/20">
                    Add {type === 'player' ? 'Player' : 'NPC'}
                  </button>
                </div>
              </div>
            )}

            {step === 'import' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40"><LinkIcon size={12} /> Character URL</label>
                  <div className="flex gap-2">
                    <input autoFocus type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.dndbeyond.com/characters/..."
                      onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                      className="flex-1 bg-black border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                    <button disabled={!url.trim() || isImporting} onClick={handleImport}
                      className="px-4 py-3 border border-[#E9BE59] text-[#E9BE59] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E9BE59] hover:text-black transition-all">
                      {isImporting ? 'Importing...' : '+ Import Character'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button onClick={() => setStep('choice')} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Cancel</button>
                  <button disabled={!url.trim() || isImporting} onClick={handleImport}
                    className="px-8 py-3 bg-[#E9BE59] text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-30 transition-all shadow-lg shadow-[#E9BE59]/20">
                    Add {type === 'player' ? 'Player' : 'NPC'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
