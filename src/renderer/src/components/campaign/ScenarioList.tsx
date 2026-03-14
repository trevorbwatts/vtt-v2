import React, { useState } from 'react'
import { useScenarioStore, useActiveScenario } from '../../store/scenario.store'
import { useMapStore } from '../../store/map.store'
import { useUIStore } from '../../store/ui.store'
import { ScenarioForm } from './ScenarioForm'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Campaign } from '../../types/campaign.types'
import type { Scenario, MapData } from '../../types/map.types'

interface ScenarioListProps {
  campaign: Campaign
}

export function ScenarioList({ campaign }: ScenarioListProps): React.ReactElement {
  const { scenarios, deleteScenario, setActiveScenario } = useScenarioStore()
  const activeScenario = useActiveScenario()
  const { loadMap } = useMapStore()
  const { setActiveView } = useUIStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | undefined>()
  const [deletingScenario, setDeletingScenario] = useState<Scenario | undefined>()
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null)

  async function handleSelectMap(scenario: Scenario, map: MapData): Promise<void> {
    setActiveScenario(scenario.id)
    await loadMap(campaign.id, scenario.id, map.id)
    setActiveView('map')
  }

  async function handleImportMap(scenario: Scenario): Promise<void> {
    setActiveScenario(scenario.id)
    const mapData = await window.api.map.import(campaign.id, scenario.id)
    if (mapData) {
      await loadMap(campaign.id, scenario.id, mapData.id)
      setActiveView('map')
    }
  }

  async function handleDeleteScenario(): Promise<void> {
    if (!deletingScenario) return
    await deleteScenario(campaign.id, deletingScenario.id)
    setDeletingScenario(undefined)
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {campaign.name}
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs px-2.5 py-1 rounded font-medium"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          + Scenario
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {scenarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="text-3xl mb-3">🗺️</div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              No scenarios
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Add a scenario to organize your maps
            </p>
          </div>
        )}
        {scenarios.map((scenario) => {
          const isExpanded = expandedScenarioId === scenario.id
          const isActiveScenario = activeScenario?.id === scenario.id
          return (
            <div key={scenario.id} className="mb-1">
              {/* Scenario row */}
              <div
                className="group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors"
                style={{
                  backgroundColor: isActiveScenario && !isExpanded ? 'var(--bg-tertiary)' : 'transparent'
                }}
                onClick={() => setExpandedScenarioId(isExpanded ? null : scenario.id)}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    isActiveScenario && !isExpanded ? 'var(--bg-tertiary)' : 'transparent'
                }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {scenario.name}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingScenario(scenario) }}
                    className="p-1 rounded text-xs"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingScenario(scenario) }}
                    className="p-1 rounded text-xs"
                    style={{ color: 'var(--danger)' }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Maps list */}
              {isExpanded && (
                <div className="ml-4 mt-0.5">
                  {scenario.maps.map((map) => (
                    <div
                      key={map.id}
                      onClick={() => handleSelectMap(scenario, map)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer mb-0.5 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}
                    >
                      <span className="text-xs">🗺️</span>
                      <span className="text-sm truncate">{map.name}</span>
                      <span
                        className="text-xs ml-auto px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: map.mode === 'play' ? 'var(--success)' : 'var(--bg-elevated)',
                          color: map.mode === 'play' ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        {map.mode}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => handleImportMap(scenario)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm transition-colors"
                    style={{ color: 'var(--accent)' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span>+</span>
                    <span>Import Map</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ScenarioForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        campaignId={campaign.id}
      />
      <ScenarioForm
        open={!!editingScenario}
        onClose={() => setEditingScenario(undefined)}
        campaignId={campaign.id}
        scenario={editingScenario}
      />
      <ConfirmDialog
        open={!!deletingScenario}
        title="Delete Scenario"
        message={`Delete "${deletingScenario?.name}" and all its maps? This cannot be undone.`}
        confirmLabel="Delete Scenario"
        danger
        onConfirm={handleDeleteScenario}
        onCancel={() => setDeletingScenario(undefined)}
      />
    </div>
  )
}
