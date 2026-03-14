import React, { useState } from 'react'
import { useActiveCampaign, useCampaignStore } from '../store/campaign.store'
import { useActiveScenario } from '../store/scenario.store'
import { PlayerCharacterForm } from '../components/campaign/PlayerCharacterForm'
import type { PlayerCharacter } from '../types/campaign.types'

type PCFormData = Omit<PlayerCharacter, 'id' | 'conditions' | 'tempHp' | 'proficiencyBonus'>

export function CampaignPage(): React.ReactElement {
  const campaign = useActiveCampaign()
  const scenario = useActiveScenario()
  const { addPlayerCharacter, updatePlayerCharacter, deletePlayerCharacter } = useCampaignStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingPc, setEditingPc] = useState<PlayerCharacter | undefined>()

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
        <div className="text-6xl">⚔️</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome to VTT
        </h1>
        <p className="text-sm text-center max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Select or create a campaign from the sidebar to get started. Campaigns hold your player
          characters and scenarios.
        </p>
      </div>
    )
  }

  function handleEdit(pc: PlayerCharacter): void {
    setEditingPc(pc)
    setFormOpen(true)
  }

  function handleAdd(): void {
    setEditingPc(undefined)
    setFormOpen(true)
  }

  function handleClose(): void {
    setFormOpen(false)
    setEditingPc(undefined)
  }

  async function handleSave(data: PCFormData): Promise<void> {
    if (!campaign) return
    if (editingPc) {
      await updatePlayerCharacter(campaign.id, editingPc.id, data)
    } else {
      await addPlayerCharacter(campaign.id, {
        ...data,
        currentHp: data.maxHp,
        tempHp: 0,
        proficiencyBonus: Math.ceil(data.level / 4) + 1,
        conditions: []
      })
    }
  }

  async function handleDelete(pcId: string): Promise<void> {
    if (!campaign) return
    await deletePlayerCharacter(campaign.id, pcId)
  }

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="max-w-3xl">
        {/* Campaign header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {campaign.description}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Players', value: campaign.playerCharacters.length, icon: '👥' },
            { label: 'Scenarios', value: campaign.scenarioIds.length, icon: '📜' },
            { label: 'Maps', value: scenario ? scenario.maps.length : '—', icon: '🗺️' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Player Characters */}
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Player Characters
            </h2>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              + Add Character
            </button>
          </div>

          {campaign.playerCharacters.length === 0 ? (
            <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
              <div className="text-2xl mb-2">👤</div>
              <p className="text-sm">No player characters yet</p>
              <p className="text-xs mt-1">Add characters to track them across scenarios</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {campaign.playerCharacters.map((pc) => (
                <div
                  key={pc.id}
                  className="flex items-center gap-3 p-3 rounded"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-muted)', color: '#a78bfa' }}
                  >
                    {pc.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {pc.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Level {pc.level} {pc.race} {pc.class}
                      {pc.subclass ? ` (${pc.subclass})` : ''}
                      {pc.playerName ? ` · ${pc.playerName}` : ''}
                    </p>
                  </div>
                  <div className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    HP {pc.currentHp}/{pc.maxHp} · AC {pc.armorClass}
                  </div>
                  <button
                    onClick={() => handleEdit(pc)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pc.id)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active scenario info */}
        {scenario && (
          <div
            className="rounded-lg p-5 mt-4"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Active Scenario: {scenario.name}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {scenario.maps.length} map{scenario.maps.length !== 1 ? 's' : ''} · Click a map in the
              sidebar to open it
            </p>
          </div>
        )}
      </div>

      <PlayerCharacterForm
        open={formOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editingPc}
      />
    </div>
  )
}
