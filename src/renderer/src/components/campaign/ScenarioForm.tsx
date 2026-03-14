import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { useScenarioStore } from '../../store/scenario.store'
import type { Scenario } from '../../types/map.types'

interface ScenarioFormProps {
  open: boolean
  onClose: () => void
  campaignId: string
  scenario?: Scenario
}

export function ScenarioForm({
  open,
  onClose,
  campaignId,
  scenario
}: ScenarioFormProps): React.ReactElement {
  const { createScenario, updateScenario } = useScenarioStore()
  const [name, setName] = useState(scenario?.name ?? '')
  const [description, setDescription] = useState(scenario?.description ?? '')
  const [saving, setSaving] = useState(false)

  const isEdit = !!scenario

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateScenario(campaignId, scenario.id, {
          name: name.trim(),
          description: description.trim() || undefined
        })
      } else {
        await createScenario({
          campaignId,
          name: name.trim(),
          description: description.trim() || undefined,
          maps: []
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)'
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Scenario' : 'New Scenario'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Scenario Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Lost Mine"
            autoFocus
            required
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={inputStyle}
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
            placeholder="What happens in this scenario?"
            rows={3}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={inputStyle}
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
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Scenario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
