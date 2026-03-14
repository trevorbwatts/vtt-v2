import React, { useEffect, useState } from 'react'
import { useCampaignStore, useActiveCampaign } from '../../store/campaign.store'
import { useScenarioStore } from '../../store/scenario.store'
import { useUIStore } from '../../store/ui.store'
import { CampaignList } from '../campaign/CampaignList'
import { ScenarioList } from '../campaign/ScenarioList'
import type { Campaign } from '../../types/campaign.types'

export function Sidebar(): React.ReactElement {
  const { loadCampaigns } = useCampaignStore()
  const activeCampaign = useActiveCampaign()
  const { loadScenarios } = useScenarioStore()
  const { activeView, setActiveView } = useUIStore()
  const [view, setView] = useState<'campaigns' | 'scenarios'>('campaigns')

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (activeCampaign) {
      loadScenarios(activeCampaign.id)
      setView('scenarios')
    }
  }, [activeCampaign?.id])

  function handleSelectCampaign(_campaign: Campaign): void {
    setView('scenarios')
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{
        width: 260,
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)'
      }}
    >
      {/* Nav tabs */}
      <div
        className="flex items-center gap-1 px-2 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {activeCampaign && (
          <button
            onClick={() => setView('campaigns')}
            className="p-1.5 rounded transition-colors"
            title="All Campaigns"
            style={{ color: view === 'campaigns' ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            ←
          </button>
        )}
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {view === 'campaigns' ? 'CAMPAIGNS' : activeCampaign?.name?.toUpperCase()}
        </span>

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setActiveView('campaign')}
            className="p-1.5 rounded text-xs transition-colors"
            title="Campaign View"
            style={{
              backgroundColor: activeView === 'campaign' ? 'var(--bg-elevated)' : 'transparent',
              color: activeView === 'campaign' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            📋
          </button>
          {activeCampaign && (
            <button
              onClick={() => setActiveView('map')}
              className="p-1.5 rounded text-xs transition-colors"
              title="Map View"
              style={{
                backgroundColor: activeView === 'map' ? 'var(--bg-elevated)' : 'transparent',
                color: activeView === 'map' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              🗺️
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'campaigns' ? (
          <CampaignList onSelect={handleSelectCampaign} />
        ) : activeCampaign ? (
          <ScenarioList campaign={activeCampaign} />
        ) : null}
      </div>
    </aside>
  )
}
