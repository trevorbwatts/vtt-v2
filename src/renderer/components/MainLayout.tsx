import { useState, useEffect, useCallback } from 'react'
import type { Campaign, Combatant, Token, Monster, MapNote } from '../types'
import { cn } from '../types'
import { useScenario } from '../hooks/useScenario'
import MapView from './MapView'
import CombatView from './CombatView'
import DMNotes from './DMNotes'
import CampaignSettings from './CampaignSettings'
import AddCombatantModal from './AddCombatantModal'
import { AnimatePresence, motion } from 'motion/react'
import {
  Menu, ArrowLeft, Edit2, X, FileText, ChevronRight
} from 'lucide-react'

interface MainLayoutProps {
  campaign: Campaign
  onCampaignUpdate: (campaign: Campaign | null) => void
  onSwitchCampaign: () => void
}

export default function MainLayout({ campaign, onCampaignUpdate, onSwitchCampaign }: MainLayoutProps) {
  const [navSidebarOpen, setNavSidebarOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editCampaignNameOpen, setEditCampaignNameOpen] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false)
  const [addNPCModalOpen, setAddNPCModalOpen] = useState(false)

  const scenario = useScenario(campaign.id)

  // Auto-select first scenario on load
  useEffect(() => {
    if (campaign.id) {
      scenario.loadScenarios()
    }
  }, [campaign.id])

  const currentScenarioName = scenario.currentScenario?.name || ''

  // ── Campaign name editing ──

  const handleUpdateCampaignName = async () => {
    if (!newCampaignName.trim()) return
    await window.api.campaigns.update(campaign.id, newCampaignName.trim())
    onCampaignUpdate({ ...campaign, name: newCampaignName.trim() })
    setEditCampaignNameOpen(false)
  }

  // ── Combatant management (passed to CampaignSettings) ──

  const addCombatant = async (data: Partial<Combatant>) => {
    const result = await window.api.combatants.upsert(campaign.id, data as Record<string, unknown>) as Combatant
    const combatants = await window.api.combatants.list(campaign.id) as Combatant[]
    onCampaignUpdate({
      ...campaign,
      players: combatants.filter(c => c.type === 'player'),
      npcs: combatants.filter(c => c.type === 'npc'),
      persistentEnemies: combatants.filter(c => c.type === 'enemy')
    })
    return result
  }

  const updateCombatant = async (data: Partial<Combatant> & { id: string }) => {
    await window.api.combatants.upsert(campaign.id, data as Record<string, unknown>)
    const combatants = await window.api.combatants.list(campaign.id) as Combatant[]
    onCampaignUpdate({
      ...campaign,
      players: combatants.filter(c => c.type === 'player'),
      npcs: combatants.filter(c => c.type === 'npc'),
      persistentEnemies: combatants.filter(c => c.type === 'enemy')
    })
  }

  const deleteCombatant = async (id: string) => {
    await window.api.combatants.delete(id)
    const combatants = await window.api.combatants.list(campaign.id) as Combatant[]
    onCampaignUpdate({
      ...campaign,
      players: combatants.filter(c => c.type === 'player'),
      npcs: combatants.filter(c => c.type === 'npc'),
      persistentEnemies: combatants.filter(c => c.type === 'enemy')
    })
  }

  // ── Add enemy to map ──

  const addEnemyToMap = useCallback(async (monster: Monster, x: number, y: number) => {
    // Create scenario combatant
    const enemyData: Partial<Combatant> = {
      name: monster.name,
      hp: monster.hp,
      maxHp: monster.hp,
      ac: monster.ac,
      initiative: 0,
      type: 'enemy',
      description: monster.description,
      stats: monster.stats,
      actions: monster.actions
    }

    const enemy = await window.api.combatants.upsert(campaign.id, {
      ...enemyData,
      type: 'enemy'
    } as Record<string, unknown>) as Combatant

    // Create token for the enemy
    await scenario.upsertToken({
      name: monster.name,
      type: 'enemy',
      x,
      y,
      color: '#ef4444',
      combatantId: enemy.id
    })
  }, [campaign.id, scenario])

  // ── Start combat ──

  const startCombat = useCallback(async (tokenIds: string[]) => {
    const selectedTokens = scenario.tokens.filter(t => tokenIds.includes(t.id))
    const current = [...scenario.activeCombatants]
    const newCombatants: Combatant[] = []

    for (const token of selectedTokens) {
      const combatantTrackerId = `combat-${token.id}`
      if (current.some(c => c.id === combatantTrackerId)) continue

      let base: Combatant | undefined
      if (token.type === 'player') {
        base = campaign.players.find(p => p.id === token.combatantId)
      } else if (token.type === 'npc') {
        base = campaign.npcs.find(n => n.id === token.combatantId)
      } else {
        base = campaign.persistentEnemies.find(e => e.id === token.combatantId)
      }

      if (base) {
        const dexMod = base.stats ? Math.floor((base.stats.dex - 10) / 2) : 0
        const roll = Math.floor(Math.random() * 20) + 1 + dexMod + (base.initiative || 0)
        newCombatants.push({ ...base, id: combatantTrackerId, initiative: roll })
      } else {
        const roll = Math.floor(Math.random() * 20) + 1
        newCombatants.push({
          id: combatantTrackerId,
          name: token.name,
          type: token.type,
          hp: 10,
          maxHp: 10,
          ac: 10,
          initiative: roll
        })
      }
    }

    if (newCombatants.length > 0) {
      await scenario.setActiveCombatantsList([...current, ...newCombatants])
    }
    setRightSidebarOpen(true)
  }, [scenario.tokens, scenario.activeCombatants, campaign.players, campaign.npcs, campaign.persistentEnemies, scenario])

  const handleMapNoteDrag = useCallback((id: string, x: number, y: number) => {
    scenario.upsertMapNote({ id, x, y })
  }, [scenario.upsertMapNote])

  const handleCombatantUpdate = useCallback((id: string, data: Partial<Combatant>) => {
    scenario.updateActiveCombatant({ id, ...data })
  }, [scenario.updateActiveCombatant])

  const handleCollapseLeft = useCallback(() => setLeftSidebarOpen(false), [])
  const handleCollapseRight = useCallback(() => setRightSidebarOpen(false), [])

  // ── Add player/NPC from modal ──

  const handleAddFromModal = async (data: Partial<Combatant>) => {
    await addCombatant(data)
  }

  return (
    <div className="h-screen flex flex-row font-sans overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Navigation Sidebar */}
      <aside
        className={cn(
          "h-full bg-[var(--surface)] overflow-hidden shrink-0 z-30 transition-[width] duration-200 ease-out",
          navSidebarOpen && "border-r border-[var(--line)]"
        )}
        style={{ width: navSidebarOpen ? 280 : 0 }}
      >
        <div className="w-[280px] h-full flex flex-col">
          <div className="h-14 px-4 border-b border-[var(--line)] flex items-center justify-between bg-black/10 shrink-0">
            <button
              onClick={onSwitchCampaign}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={14} />
              <span>Switch Campaign</span>
            </button>
            <button
              onClick={() => setNavSidebarOpen(false)}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-[var(--accent)]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Campaign Section */}
            <div>
              <div className="px-2 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase tracking-widest opacity-50 font-sans font-bold">Campaign</h3>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent)] hover:underline"
                  >
                    Settings
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-bold font-serif tracking-tight truncate">{campaign.name}</div>
                  <button
                    onClick={() => { setNewCampaignName(campaign.name); setEditCampaignNameOpen(true) }}
                    className="p-1 hover:bg-black/5 rounded transition-colors opacity-40 hover:opacity-100"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--line)] mx-2" />

            {/* Players Section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-[10px] uppercase tracking-widest opacity-50 font-sans font-bold">Players</h3>
                <button
                  onClick={() => setAddPlayerModalOpen(true)}
                  className="text-[9px] uppercase tracking-widest font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  + Add Player
                </button>
              </div>
              <div className="space-y-1">
                {campaign.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 transition-all group">
                    <div className="w-6 h-6 rounded-full bg-[var(--btn-bg)] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {p.name[0]}
                    </div>
                    <span className="text-sm font-medium opacity-80 group-hover:opacity-100 truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--line)] mx-2" />

            {/* NPCs Section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-[10px] uppercase tracking-widest opacity-50 font-sans font-bold">NPCs</h3>
                <button
                  onClick={() => setAddNPCModalOpen(true)}
                  className="text-[9px] uppercase tracking-widest font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  + Add NPC
                </button>
              </div>
              <div className="space-y-1">
                {campaign.npcs.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 transition-all group">
                    <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {n.name[0]}
                    </div>
                    <span className="text-sm font-medium opacity-80 group-hover:opacity-100 truncate">{n.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--line)] mx-2" />

            {/* Scenarios Section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-[10px] uppercase tracking-widest opacity-50 font-sans font-bold">Scenarios</h3>
                <button
                  onClick={() => scenario.createScenario('New Scenario')}
                  className="text-[9px] uppercase tracking-widest font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  + Add Scenario
                </button>
              </div>
              <div className="space-y-1">
                {scenario.scenarios.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => scenario.setSelectedScenarioId(s.id)}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        scenario.selectedScenarioId === s.id
                          ? "bg-black/5 text-[var(--ink)] border border-[var(--line)]"
                          : "hover:bg-black/5 opacity-60 hover:opacity-100 border border-transparent"
                      )}
                    >
                      <FileText size={14} className={cn(scenario.selectedScenarioId === s.id ? "text-[var(--accent)]" : "opacity-40")} />
                      <span className="flex-1 text-left truncate">{s.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[var(--line)] bg-black/5 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-[var(--btn-bg)] flex items-center justify-center text-white font-bold text-xs">
                DM
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Dungeon Master</span>
                <span className="text-[9px] opacity-40 font-sans">v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[var(--line)] bg-[var(--surface)] px-4 flex items-center h-14 shrink-0 z-20">
          <div className="flex items-center gap-4">
            {!navSidebarOpen && (
              <button
                onClick={() => setNavSidebarOpen(true)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors group"
              >
                <Menu size={20} className="group-hover:text-[var(--accent)] transition-colors" />
              </button>
            )}
            <div className="flex items-center gap-3 text-lg font-serif font-bold tracking-tight">
              <span className="opacity-40">{campaign.name}</span>
              {currentScenarioName && (
                <>
                  <ChevronRight size={16} className="opacity-20 shrink-0" />
                  <span className="text-[var(--accent)]">{currentScenarioName}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main 3-Panel Layout */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar: DM Notes */}
          <aside
            className={cn(
              "bg-[var(--surface)] overflow-hidden shrink-0 z-10 transition-[width] duration-200 ease-out",
              leftSidebarOpen && "border-r border-[var(--line)]"
            )}
            style={{ width: leftSidebarOpen ? 320 : 0 }}
          >
            <div className="w-[320px] h-full relative">
              <div className="absolute inset-0 bg-[var(--parchment-texture)] opacity-10 pointer-events-none" />
              <DMNotes
                notes={scenario.mapNotes}
                onDelete={scenario.deleteMapNote}
                onCollapse={handleCollapseLeft}
              />
            </div>
          </aside>

          {/* Center: Map View */}
          <main className="flex-1 relative bg-[#111] overflow-hidden">
            {scenario.selectedScenarioId && (
              <MapView
                tokens={scenario.tokens}
                mapImageDataUrl={scenario.mapImageDataUrl}
                mapNotes={scenario.mapNotes}
                players={campaign.players}
                npcs={campaign.npcs}
                persistentEnemies={campaign.persistentEnemies}
                scenarioCombatants={[]}
                onTokenDrag={scenario.updateTokenPosition}
                onTokenUpsert={scenario.upsertToken}
                onTokenDelete={scenario.deleteToken}
                onMapNoteUpsert={scenario.upsertMapNote}
                onMapNoteDelete={scenario.deleteMapNote}
                onMapNoteDrag={handleMapNoteDrag}
                onAddEnemy={addEnemyToMap}
                onStartCombat={startCombat}
                onUploadMap={scenario.uploadMapImage}
                leftSidebarOpen={leftSidebarOpen}
                setLeftSidebarOpen={setLeftSidebarOpen}
                rightSidebarOpen={rightSidebarOpen}
                setRightSidebarOpen={setRightSidebarOpen}
              />
            )}
          </main>

          {/* Right Sidebar: Combat View */}
          <aside
            className={cn(
              "bg-[var(--surface)] overflow-hidden shrink-0 z-10 transition-[width] duration-200 ease-out",
              rightSidebarOpen && "border-l border-[var(--line)]"
            )}
            style={{ width: rightSidebarOpen ? 350 : 0 }}
          >
            <div className="w-[350px] h-full relative">
              <div className="absolute inset-0 bg-[var(--parchment-texture)] opacity-10 pointer-events-none" />
              <CombatView
                activeCombatants={scenario.activeCombatants}
                onUpdate={handleCombatantUpdate}
                onRemove={scenario.removeActiveCombatant}
                onClear={scenario.clearActiveCombat}
                onBulkSet={scenario.setActiveCombatantsList}
                onCollapse={handleCollapseRight}
              />
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="h-6 border-t border-[var(--line)] bg-[var(--surface)] px-4 flex items-center justify-between text-[9px] font-sans opacity-50 uppercase tracking-widest shrink-0 z-20">
          <div className="flex gap-4">
            <span>System: Online</span>
            <span className="text-[var(--accent)]">Campaign: {campaign.name}</span>
          </div>
          <div className="flex gap-4">
            <span>{scenario.scenarios.length} Scenarios</span>
          </div>
        </footer>
      </div>

      {/* Campaign Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CampaignSettings
              players={campaign.players}
              npcs={campaign.npcs}
              onAddCombatant={addCombatant}
              onUpdateCombatant={updateCombatant}
              onDeleteCombatant={deleteCombatant}
              onClose={() => setSettingsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Campaign Name Modal */}
      <AnimatePresence>
        {editCampaignNameOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--line)] flex justify-between items-center">
                <h2 className="text-lg font-serif font-bold">Edit Campaign Name</h2>
                <button onClick={() => setEditCampaignNameOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-50 font-sans font-bold">New Campaign Name</label>
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="w-full bg-black/5 border border-[var(--line)] rounded-lg px-4 py-3 font-serif text-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="Enter campaign name..."
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCampaignName()}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditCampaignNameOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--line)] text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCampaignName}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--btn-bg)] text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--btn-bg)]/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Player/NPC Modals */}
      <AddCombatantModal
        isOpen={addPlayerModalOpen}
        onClose={() => setAddPlayerModalOpen(false)}
        type="player"
        onAdd={handleAddFromModal}
      />
      <AddCombatantModal
        isOpen={addNPCModalOpen}
        onClose={() => setAddNPCModalOpen(false)}
        type="npc"
        onAdd={handleAddFromModal}
      />
    </div>
  )
}
