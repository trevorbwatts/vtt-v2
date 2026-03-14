import React, { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { SearchInput } from '../common/SearchInput'
import { useBestiaryStore } from '../../store/bestiary.store'
import { useMapStore } from '../../store/map.store'
import type { MonsterInstance } from '../../types/map.types'
import { useUIStore } from '../../store/ui.store'
import { nanoid } from 'nanoid'
import type { MonsterIndexEntry } from '../../types/bestiary.types'
import type { BestiaryEdition } from '../../types/bestiary.types'

const CREATURE_TYPES = [
  'aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental',
  'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead'
]

function CRBadge({ cr }: { cr?: string | number }): React.ReactElement {
  if (cr === undefined || cr === null || cr === '') return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const crStr = String(cr)
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-mono"
      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
    >
      CR {crStr}
    </span>
  )
}

function MonsterListItem({
  entry,
  isSelected,
  onClick
}: {
  entry: MonsterIndexEntry
  isSelected: boolean
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 transition-colors border-b"
      style={{
        backgroundColor: isSelected ? 'var(--accent-muted)' : 'transparent',
        borderColor: 'var(--border-muted)',
        borderBottomWidth: 1
      }}
      onMouseOver={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
      }}
      onMouseOut={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm truncate" style={{ color: isSelected ? '#a78bfa' : 'var(--text-primary)' }}>
          {entry.name}
        </span>
        <CRBadge cr={entry.cr} />
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
          {entry.type}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
        <span
          className="text-xs px-1 rounded"
          style={{
            backgroundColor: entry.edition === '2024' ? 'var(--accent-muted)' : 'var(--bg-elevated)',
            color: entry.edition === '2024' ? '#a78bfa' : 'var(--text-muted)'
          }}
        >
          {entry.edition}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.source}</span>
      </div>
    </button>
  )
}

function renderEntryText(entry: string | object): string {
  if (typeof entry === 'string') return entry
  const e = entry as Record<string, unknown>
  if (e.type === 'entries' && Array.isArray(e.entries)) {
    return (e.entries as (string | object)[]).map(renderEntryText).join(' ')
  }
  if (e.type === 'table') return '[Table]'
  if (e.type === 'list' && Array.isArray(e.items)) {
    return (e.items as (string | object)[]).map(renderEntryText).join(', ')
  }
  return ''
}

function MonsterStatCard(): React.ReactElement | null {
  const { selectedMonster } = useBestiaryStore()
  const { addToken, addMonsterInstance, mapData } = useMapStore()
  const { closeBestiary, contextMenu } = useUIStore()
  const [quantity, setQuantity] = useState(1)

  if (!selectedMonster) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <div className="text-4xl">👹</div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Select a monster to view its stats
        </p>
      </div>
    )
  }

  const m = selectedMonster

  const cr = m.cr
    ? typeof m.cr === 'object'
      ? (m.cr as { cr: string }).cr
      : String(m.cr)
    : '—'

  const ac = m.ac?.[0]?.ac ?? '—'
  const hp = m.hp ? `${m.hp.average} (${m.hp.formula})` : '—'
  const type = typeof m.type === 'object'
    ? `${(m.type as { type: string }).type}${(m.type as { tags?: string[] }).tags?.length ? ` (${(m.type as { tags: string[] }).tags.join(', ')})` : ''}`
    : m.type ?? '—'

  function handleAddToMap(): void {
    if (!mapData) return

    const maxHp = m.hp?.average ?? 0
    const placeX = contextMenu.mapX || 200
    const placeY = contextMenu.mapY || 200
    const cellSize = mapData.gridConfig.cellSize

    for (let i = 0; i < quantity; i++) {
      const instanceId = nanoid()
      const monsterInstance: MonsterInstance = { id: instanceId, statBlock: m }
      addMonsterInstance(monsterInstance)
      addToken({
        type: 'monster',
        monsterInstanceId: instanceId,
        name: quantity > 1 ? `${m.name} ${i + 1}` : m.name,
        x: placeX + i * (cellSize + 4),
        y: placeY,
        sizeInCells: 1,
        conditions: [],
        currentHp: maxHp,
        maxHp,
        visible: true
      })
    }

    closeBestiary()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Monster header */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{m.name}</h2>
        <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
          {m.size?.join('/') ?? ''} {type} · CR {cr} · {m.source}
        </p>

        {/* Add to map controls */}
        <div className="flex items-center gap-2 mt-3">
          <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Quantity:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
            className="w-16 px-2 py-1 rounded text-sm"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleAddToMap}
            disabled={!mapData}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: mapData ? 'var(--accent)' : 'var(--bg-elevated)',
              color: mapData ? '#fff' : 'var(--text-muted)'
            }}
          >
            + Add to Map
          </button>
          {!mapData && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Open a map first</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Core stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Armor Class', value: String(ac) },
            { label: 'Hit Points', value: hp },
            { label: 'Challenge', value: `CR ${cr}` }
          ].map((s) => (
            <div key={s.label} className="p-2 rounded text-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ability scores */}
        {m.str !== undefined && (
          <div className="grid grid-cols-6 gap-1 mb-4">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ab) => {
              const score = m[ab] ?? 10
              const mod = Math.floor((score - 10) / 2)
              return (
                <div key={ab} className="text-center p-2 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{ab}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{score}</p>
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>{mod >= 0 ? `+${mod}` : mod}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Traits */}
        {m.trait && m.trait.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>TRAITS</p>
            {m.trait.map((t, i) => (
              <div key={i} className="mb-2">
                <span className="text-xs font-bold italic" style={{ color: 'var(--text-primary)' }}>{t.name}. </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {t.entries.map(renderEntryText).join(' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {m.action && m.action.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>ACTIONS</p>
            {m.action.map((a, i) => (
              <div key={i} className="mb-2">
                <span className="text-xs font-bold italic" style={{ color: 'var(--text-primary)' }}>{a.name}. </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {a.entries.map(renderEntryText).join(' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Legendary */}
        {m.legendary && m.legendary.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>LEGENDARY ACTIONS</p>
            {(m.legendaryHeader ?? []).map((h, i) => (
              <p key={i} className="text-xs italic mb-2" style={{ color: 'var(--text-secondary)' }}>{h}</p>
            ))}
            {m.legendary.map((a, i) => (
              <div key={i} className="mb-2">
                <span className="text-xs font-bold italic" style={{ color: 'var(--text-primary)' }}>{a.name}. </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {a.entries.map(renderEntryText).join(' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BestiaryModal(): React.ReactElement {
  const { bestiaryOpen, closeBestiary } = useUIStore()
  const {
    index,
    indexLoaded,
    loading,
    searchQuery,
    searchResults,
    editionFilter,
    typeFilter,
    loadIndex,
    selectMonster,
    setSearch,
    setEditionFilter,
    setTypeFilter
  } = useBestiaryStore()

  const [selectedEntry, setSelectedEntry] = useState<MonsterIndexEntry | null>(null)

  useEffect(() => {
    if (bestiaryOpen && !indexLoaded) {
      loadIndex()
    }
  }, [bestiaryOpen])

  async function handleSelectEntry(entry: MonsterIndexEntry): Promise<void> {
    setSelectedEntry(entry)
    await selectMonster(entry.name, entry.source, entry.edition)
  }

  return (
    <Modal
      open={bestiaryOpen}
      onClose={closeBestiary}
      title="Bestiary"
      width="max-w-5xl"
      closeOnBackdrop={false}
    >
      <div className="flex gap-4" style={{ height: 580 }}>
        {/* Left: Search + list */}
        <div className="flex flex-col" style={{ width: 300, flexShrink: 0 }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearch}
            placeholder="Search monsters..."
            autoFocus
          />

          {/* Filters */}
          <div className="flex gap-2 mt-2">
            {/* Edition filter */}
            <div className="flex rounded overflow-hidden flex-1" style={{ border: '1px solid var(--border)' }}>
              {(['all', '2014', '2024'] as const).map((ed) => (
                <button
                  key={ed}
                  onClick={() => setEditionFilter(ed as BestiaryEdition | 'all')}
                  className="flex-1 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: editionFilter === ed ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: editionFilter === ed ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {ed === 'all' ? 'All' : ed}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mt-2 w-full px-2 py-1.5 rounded text-xs outline-none"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Types</option>
            {CREATURE_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          {/* Results count */}
          <p className="text-xs mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}${index.length > 0 ? ` of ${index.length}` : ''}`}
          </p>

          {/* List */}
          <div className="flex-1 overflow-y-auto rounded" style={{ border: '1px solid var(--border)' }}>
            {searchResults.map((entry) => (
              <MonsterListItem
                key={`${entry.source}-${entry.name}`}
                entry={entry}
                isSelected={selectedEntry?.name === entry.name && selectedEntry?.source === entry.source}
                onClick={() => handleSelectEntry(entry)}
              />
            ))}
          </div>
        </div>

        {/* Right: Stat block */}
        <div
          className="flex-1 rounded overflow-hidden"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)' }}
        >
          <MonsterStatCard />
        </div>
      </div>
    </Modal>
  )
}
