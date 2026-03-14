import React from 'react'
import { Modal } from '../common/Modal'
import { useUIStore } from '../../store/ui.store'
import { useMapStore } from '../../store/map.store'
import { useCampaignStore, useActiveCampaign } from '../../store/campaign.store'
import type { PlayerCharacter } from '../../types/campaign.types'

export function AddPlayersModal(): React.ReactElement {
  const { addPlayersOpen, closeAddPlayers, contextMenu } = useUIStore()
  const { mapData, addToken, moveToken } = useMapStore()
  const campaign = useActiveCampaign()
  const { campaigns } = useCampaignStore()

  // Collect all PCs from all campaigns, prioritising the active one
  const allPcs: (PlayerCharacter & { campaignName: string })[] = []
  for (const c of campaigns) {
    for (const pc of c.playerCharacters) {
      allPcs.push({ ...pc, campaignName: c.name })
    }
  }

  function getExistingToken(pcId: string): string | undefined {
    return mapData?.tokens.find((t) => t.playerCharacterId === pcId)?.id
  }

  function handleSelect(pc: PlayerCharacter): void {
    const { mapX, mapY } = contextMenu
    const existingTokenId = getExistingToken(pc.id)

    if (existingTokenId) {
      // Move existing token to new position
      moveToken(existingTokenId, mapX, mapY)
    } else {
      // Place new token
      addToken({
        type: 'player',
        playerCharacterId: pc.id,
        name: pc.name,
        x: mapX,
        y: mapY,
        sizeInCells: 1,
        tokenImagePath: pc.tokenImagePath,
        conditions: [],
        currentHp: pc.currentHp,
        maxHp: pc.maxHp,
        visible: true
      })
    }
    closeAddPlayers()
  }

  const noCampaign = campaigns.length === 0 || allPcs.length === 0

  return (
    <Modal
      open={addPlayersOpen}
      onClose={closeAddPlayers}
      title="Add / Move Players"
      width="max-w-sm"
    >
      {noCampaign ? (
        <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
          <div className="text-2xl mb-2">👤</div>
          <p className="text-sm">No player characters found.</p>
          <p className="text-xs mt-1">Add characters to a campaign first.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {allPcs.map((pc) => {
            const onMap = !!getExistingToken(pc.id)
            const showCampaignName = campaigns.length > 1 || !campaign
            return (
              <button
                key={pc.id}
                onClick={() => handleSelect(pc)}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors w-full"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent-muted)', color: '#a78bfa' }}
                >
                  {pc.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {pc.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    Lv {pc.level} {pc.race} {pc.class}
                    {showCampaignName ? ` · ${pc.campaignName}` : ''}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: onMap ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                    color: onMap ? '#a78bfa' : 'var(--text-muted)'
                  }}
                >
                  {onMap ? 'Move' : 'Place'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
