import React, { useState } from 'react'
import { useCampaignStore, useActiveCampaign } from '../../store/campaign.store'
import { CampaignForm } from './CampaignForm'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Campaign } from '../../types/campaign.types'

interface CampaignListProps {
  onSelect: (campaign: Campaign) => void
}

export function CampaignList({ onSelect }: CampaignListProps): React.ReactElement {
  const { campaigns, deleteCampaign, setActiveCampaign } = useCampaignStore()
  const activeCampaign = useActiveCampaign()
  const [showCreate, setShowCreate] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>()
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | undefined>()

  function handleSelect(campaign: Campaign): void {
    setActiveCampaign(campaign.id)
    onSelect(campaign)
  }

  async function handleDelete(): Promise<void> {
    if (!deletingCampaign) return
    await deleteCampaign(deletingCampaign.id)
    setDeletingCampaign(undefined)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Campaigns
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs px-2.5 py-1 rounded font-medium transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          + New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-3xl mb-3">⚔️</div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              No campaigns yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Create your first campaign to get started
            </p>
          </div>
        )}
        {campaigns.map((campaign) => {
          const isActive = activeCampaign?.id === campaign.id
          return (
            <div
              key={campaign.id}
              onClick={() => handleSelect(campaign)}
              className="group flex items-center justify-between px-3 py-2.5 rounded cursor-pointer mb-1 transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: isActive ? '#a78bfa' : 'var(--text-primary)' }}
                >
                  {campaign.name}
                </p>
                {campaign.description && (
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {campaign.description}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {campaign.playerCharacters.length} player{campaign.playerCharacters.length !== 1 ? 's' : ''} ·{' '}
                  {campaign.scenarioIds.length} scenario{campaign.scenarioIds.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCampaign(campaign) }}
                  className="p-1 rounded text-xs"
                  style={{ color: 'var(--text-muted)' }}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingCampaign(campaign) }}
                  className="p-1 rounded text-xs"
                  style={{ color: 'var(--danger)' }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <CampaignForm open={showCreate} onClose={() => setShowCreate(false)} />
      <CampaignForm
        open={!!editingCampaign}
        onClose={() => setEditingCampaign(undefined)}
        campaign={editingCampaign}
      />
      <ConfirmDialog
        open={!!deletingCampaign}
        title="Delete Campaign"
        message={`Delete "${deletingCampaign?.name}"? This will permanently remove all scenarios and maps. This cannot be undone.`}
        confirmLabel="Delete Campaign"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingCampaign(undefined)}
      />
    </div>
  )
}
