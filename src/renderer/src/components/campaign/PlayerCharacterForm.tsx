import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import type { PlayerCharacter } from '../../types/campaign.types'

type PCFormData = Omit<PlayerCharacter, 'id' | 'conditions' | 'tempHp' | 'proficiencyBonus'>

interface PlayerCharacterFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: PCFormData) => Promise<void>
  initial?: PlayerCharacter
}

const DEFAULT: PCFormData = {
  name: '',
  playerName: '',
  race: '',
  class: '',
  subclass: '',
  level: 1,
  maxHp: 10,
  currentHp: 10,
  armorClass: 10,
  speed: 30,
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  notes: ''
}

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export function PlayerCharacterForm({
  open,
  onClose,
  onSave,
  initial
}: PlayerCharacterFormProps): React.ReactElement | null {
  const [form, setForm] = useState<PCFormData>(DEFAULT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (initial) {
        const { id: _id, conditions: _c, tempHp: _t, proficiencyBonus: _p, ...rest } = initial
        setForm(rest)
      } else {
        setForm(DEFAULT)
      }
    }
  }, [open, initial])

  function setField<K extends keyof PCFormData>(key: K, value: PCFormData[K]): void {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(): Promise<void> {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave({ ...form, name: form.name.trim() })
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

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.currentTarget.style.borderColor = 'var(--accent)'),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.currentTarget.style.borderColor = 'var(--border)')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Character' : 'Add Player Character'}
      width="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {/* Name + Player */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Character Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Thorin Oakenshield"
              autoFocus
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={inputStyle}
              {...focusStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Player Name
            </label>
            <input
              type="text"
              value={form.playerName ?? ''}
              onChange={(e) => setField('playerName', e.target.value)}
              placeholder="John"
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={inputStyle}
              {...focusStyle}
            />
          </div>
        </div>

        {/* Race + Class + Subclass + Level */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Race</label>
            <input
              type="text"
              value={form.race}
              onChange={(e) => setField('race', e.target.value)}
              placeholder="Dwarf"
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={inputStyle}
              {...focusStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Class</label>
            <input
              type="text"
              value={form.class}
              onChange={(e) => setField('class', e.target.value)}
              placeholder="Fighter"
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={inputStyle}
              {...focusStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Subclass</label>
            <input
              type="text"
              value={form.subclass ?? ''}
              onChange={(e) => setField('subclass', e.target.value)}
              placeholder="Battle Master"
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={inputStyle}
              {...focusStyle}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Level</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.level}
              onChange={(e) => setField('level', Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
              className="w-full px-3 py-1.5 rounded text-sm outline-none"
              style={inputStyle}
              {...focusStyle}
            />
          </div>
        </div>

        {/* HP + AC + Speed */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'maxHp', label: 'Max HP', min: 1, max: 999 },
            { key: 'armorClass', label: 'Armor Class', min: 1, max: 30 },
            { key: 'speed', label: 'Speed (ft)', min: 0, max: 120 }
          ] as { key: keyof PCFormData; label: string; min: number; max: number }[]).map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={form[key] as number}
                onChange={(e) =>
                  setField(key, Math.max(min, Math.min(max, parseInt(e.target.value, 10) || min)))
                }
                className="w-full px-3 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                {...focusStyle}
              />
            </div>
          ))}
        </div>

        {/* Ability scores */}
        <div>
          <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Ability Scores</label>
          <div className="grid grid-cols-6 gap-2">
            {ABILITIES.map((ab) => {
              const score = form.abilityScores[ab]
              const mod = Math.floor((score - 10) / 2)
              return (
                <div key={ab} className="text-center">
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{ab}</p>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={score}
                    onChange={(e) =>
                      setField('abilityScores', {
                        ...form.abilityScores,
                        [ab]: Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 10))
                      })
                    }
                    className="w-full px-1 py-1.5 rounded text-sm text-center outline-none"
                    style={inputStyle}
                    {...focusStyle}
                  />
                  <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                    {mod >= 0 ? `+${mod}` : mod}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Character notes..."
            rows={2}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={inputStyle}
            {...focusStyle}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#fff',
              opacity: !form.name.trim() || saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : initial ? 'Save' : 'Add Character'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
