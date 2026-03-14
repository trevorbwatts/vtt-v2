import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { useCampaignStore } from '../../store/campaign.store'
import type { Campaign } from '../../types/campaign.types'

interface CampaignFormProps {
  open: boolean
  onClose: () => void
  /** Provide to edit an existing campaign */
  campaign?: Campaign
}

export function CampaignForm({ open, onClose, campaign }: CampaignFormProps): React.ReactElement {
  const { createCampaign, updateCampaign } = useCampaignStore()
  const [name, setName] = useState(campaign?.name ?? '')
  const [description, setDescription] = useState(campaign?.description ?? '')
  const [saving, setSaving] = useState(false)

  const isEdit = !!campaign

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateCampaign(campaign.id, { name: name.trim(), description: description.trim() || undefined })
      } else {
        await createCampaign({
          name: name.trim(),
          description: description.trim() || undefined,
          playerCharacters: [],
          scenarioIds: []
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Campaign' : 'New Campaign'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter campaign name"
            autoFocus
            required
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the campaign"
            rows={3}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#fff',
              opacity: saving || !name.trim() ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
