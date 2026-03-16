import { useState } from 'react'
import type { Combatant, ClassDefinition } from '../types'
import { cn } from '../types'
import { X, Plus, Trash2, User, Shield, Heart, Sword, Zap, Wind, Eye, RefreshCw } from 'lucide-react'

interface CampaignSettingsProps {
  players: Combatant[]
  npcs: Combatant[]
  onAddCombatant: (data: Partial<Combatant>) => Promise<Combatant | null>
  onUpdateCombatant: (data: Partial<Combatant> & { id: string }) => Promise<void>
  onDeleteCombatant: (id: string) => Promise<void>
  onClose: () => void
}

export default function CampaignSettings({ players, npcs, onAddCombatant, onUpdateCombatant, onDeleteCombatant, onClose }: CampaignSettingsProps) {
  const [activeTab, setActiveTab] = useState<'players' | 'npcs'>('players')
  const [isImporting, setIsImporting] = useState(false)

  const currentList = activeTab === 'players' ? players : npcs

  const getCharacterLevel = (classes?: ClassDefinition[]) => {
    return classes?.reduce((sum, c) => sum + c.level, 0) || 0
  }

  const addClass = (combatantId: string) => {
    const combatant = players.find(p => p.id === combatantId)
    if (!combatant) return
    const classes = [...(combatant.classes || []), { name: 'New Class', level: 1 }]
    onUpdateCombatant({ id: combatantId, classes } as any)
  }

  const removeClass = (combatantId: string, index: number) => {
    const combatant = players.find(p => p.id === combatantId)
    if (!combatant?.classes) return
    const classes = combatant.classes.filter((_, i) => i !== index)
    onUpdateCombatant({ id: combatantId, classes } as any)
  }

  const updateClass = (combatantId: string, index: number, updates: Partial<ClassDefinition>) => {
    const combatant = players.find(p => p.id === combatantId)
    if (!combatant?.classes) return
    const classes = combatant.classes.map((c, i) => i === index ? { ...c, ...updates } : c)
    onUpdateCombatant({ id: combatantId, classes } as any)
  }

  const syncCharacter = async (combatantId: string) => {
    const combatant = players.find(p => p.id === combatantId)
    if (!combatant?.dndBeyondId) return

    setIsImporting(true)
    try {
      const result = await window.api.dndbeyond.fetchCharacter(combatant.dndBeyondId) as { success: boolean; data?: any; error?: string }
      if (result.success && result.data) {
        await onUpdateCombatant({
          id: combatantId,
          name: result.data.name,
          hp: result.data.hp,
          max_hp: result.data.maxHp,
          ac: result.data.ac,
          species: result.data.species,
          speed: result.data.speed,
          darkvision: result.data.darkvision,
          classes: result.data.classes,
          initiative: result.data.initiative
        } as any)
      } else if (result.error === 'CHARACTER_PRIVATE') {
        alert('Failed to sync: Character is now Private.')
      } else {
        alert('Failed to sync with D&D Beyond.')
      }
    } catch {
      alert('Failed to sync with D&D Beyond. Please try again later.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--line)] w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-hover)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--ink)] text-[var(--bg)] rounded">
              <Sword size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Players & NPCs</h2>
              <p className="text-[10px] uppercase tracking-widest opacity-50">Manage Campaign Entities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[var(--line)]">
          {([{ id: 'players', label: 'Players' }, { id: 'npcs', label: 'NPCs' }] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2',
                activeTab === tab.id ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-hover)]' : 'border-transparent opacity-50 hover:opacity-100'
              )}
            >
              <User size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex justify-start px-2">
            <button
              onClick={() => onAddCombatant({
                name: `New ${activeTab === 'players' ? 'Player' : 'NPC'}`,
                initiative: 0, hp: 10, max_hp: 10, ac: 10,
                type: activeTab === 'players' ? 'player' : 'npc',
                stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                actions: []
              } as any)}
              className="flex items-center gap-2 bg-[var(--btn-bg)] text-white px-4 py-2 rounded font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
            >
              <Plus size={14} /> Add {activeTab === 'players' ? 'Player' : 'NPC'}
            </button>
          </div>

          {currentList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <Plus size={48} />
              <p className="mt-2 font-mono text-sm uppercase tracking-widest">No {activeTab} defined</p>
            </div>
          ) : (
            currentList.map((c) => (
              <div key={c.id} className="p-4 border border-[var(--line)] bg-[var(--surface-hover)] rounded-lg flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {c.dndBeyondId ? (
                        <div className="font-bold text-xl flex-1 py-1">{c.name}</div>
                      ) : (
                        <input
                          value={c.name}
                          onChange={(e) => onUpdateCombatant({ id: c.id, name: e.target.value })}
                          className="bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--accent)] outline-none font-bold text-xl flex-1"
                          placeholder="Entity Name"
                        />
                      )}
                      {c.type === 'player' && (
                        <div className="flex items-center gap-2">
                          {c.dndBeyondId && (
                            <button
                              onClick={() => syncCharacter(c.id)}
                              disabled={isImporting}
                              className="p-1 hover:bg-black/10 rounded text-[var(--accent)] transition-all"
                              title="Sync from D&D Beyond"
                            >
                              <RefreshCw size={14} className={isImporting ? 'animate-spin' : ''} />
                            </button>
                          )}
                          <div className="bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Level {getCharacterLevel(c.classes)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteCombatant(c.id)}
                    className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {c.type === 'player' && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-black/20 rounded-lg border border-[var(--line)]/50">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-50 flex items-center gap-1"><User size={10} /> Species</label>
                      {c.dndBeyondId ? (
                        <div className="px-2 py-1 text-sm font-medium">{c.species || '\u2014'}</div>
                      ) : (
                        <input value={c.species || ''} onChange={(e) => onUpdateCombatant({ id: c.id, species: e.target.value })}
                          className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 text-sm outline-none focus:border-[var(--accent)]" placeholder="Species" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-50 flex items-center gap-1"><Wind size={10} /> Speed</label>
                      {c.dndBeyondId ? (
                        <div className="px-2 py-1 font-mono text-sm">{c.speed || 0} ft</div>
                      ) : (
                        <input type="number" value={c.speed || 0} onChange={(e) => onUpdateCombatant({ id: c.id, speed: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 font-mono text-sm outline-none focus:border-[var(--accent)]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-50 flex items-center gap-1"><Eye size={10} /> Darkvision</label>
                      {c.dndBeyondId ? (
                        <div className="px-2 py-1 font-mono text-sm">{c.darkvision || 0} ft</div>
                      ) : (
                        <input type="number" value={c.darkvision || 0} onChange={(e) => onUpdateCombatant({ id: c.id, darkvision: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 font-mono text-sm outline-none focus:border-[var(--accent)]" />
                      )}
                    </div>
                  </div>
                )}

                {c.type === 'player' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold opacity-50">Classes & Levels</h3>
                      {!c.dndBeyondId && (
                        <button onClick={() => addClass(c.id)} className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent)] hover:underline flex items-center gap-1">
                          <Plus size={10} /> Add Class
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {c.classes?.map((cls, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4 space-y-1">
                            <label className="text-[8px] uppercase tracking-widest opacity-30">Class</label>
                            {c.dndBeyondId ? <div className="px-2 py-1 text-xs font-medium">{cls.name}</div> : (
                              <input value={cls.name} onChange={(e) => updateClass(c.id, idx, { name: e.target.value })}
                                className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--accent)]" />
                            )}
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] uppercase tracking-widest opacity-30">Level</label>
                            {c.dndBeyondId ? <div className="px-2 py-1 font-mono text-xs">{cls.level}</div> : (
                              <input type="number" value={cls.level} onChange={(e) => updateClass(c.id, idx, { level: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 font-mono text-xs outline-none focus:border-[var(--accent)]" />
                            )}
                          </div>
                          <div className="col-span-5 space-y-1">
                            <label className="text-[8px] uppercase tracking-widest opacity-30">Subclass</label>
                            {c.dndBeyondId ? <div className="px-2 py-1 text-xs font-medium">{cls.subclass || '\u2014'}</div> : (
                              <input value={cls.subclass || ''} onChange={(e) => updateClass(c.id, idx, { subclass: e.target.value })}
                                className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--accent)]" placeholder="Subclass" />
                            )}
                          </div>
                          {!c.dndBeyondId && (
                            <div className="col-span-1 pb-1">
                              <button onClick={() => removeClass(c.id, idx)} className="p-1.5 text-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest opacity-50 flex items-center gap-1"><Heart size={10} /> Max HP</label>
                    {c.dndBeyondId ? <div className="px-2 py-1 font-mono text-sm">{c.maxHp}</div> : (
                      <input type="number" value={c.maxHp} onChange={(e) => { const val = parseInt(e.target.value) || 0; onUpdateCombatant({ id: c.id, max_hp: val, hp: val } as any) }}
                        className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 font-mono text-sm outline-none focus:border-[var(--accent)]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest opacity-50 flex items-center gap-1"><Shield size={10} /> Armor Class</label>
                    {c.dndBeyondId ? <div className="px-2 py-1 font-mono text-sm">{c.ac}</div> : (
                      <input type="number" value={c.ac} onChange={(e) => onUpdateCombatant({ id: c.id, ac: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 font-mono text-sm outline-none focus:border-[var(--accent)]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest opacity-50 flex items-center gap-1"><Zap size={10} /> Base Init</label>
                    {c.dndBeyondId ? <div className="px-2 py-1 font-mono text-sm">{c.initiative}</div> : (
                      <input type="number" value={c.initiative} onChange={(e) => onUpdateCombatant({ id: c.id, initiative: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black border border-[var(--line)] rounded px-2 py-1 font-mono text-sm outline-none focus:border-[var(--accent)]" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-hover)] flex justify-between items-center">
          <div className="text-[10px] uppercase tracking-widest opacity-30 font-mono">
            {currentList.length} {activeTab} total
          </div>
        </div>
      </div>
    </div>
  )
}
