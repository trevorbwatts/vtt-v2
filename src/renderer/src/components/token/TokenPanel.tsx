import React, { useState } from 'react'
import { useMapStore, useSelectedToken } from '../../store/map.store'
import type { TokenInstance } from '../../types/map.types'
import type { MonsterStatBlock, MonsterFeature } from '../../types/bestiary.types'

function abilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : String(mod)
}

function renderEntries(entries: (string | object)[]): string {
  return entries
    .map((e) => (typeof e === 'string' ? e : JSON.stringify(e)))
    .join(' ')
}

function StatsColumn({ token, statBlock }: { token: TokenInstance; statBlock?: MonsterStatBlock }): React.ReactElement {
  const { updateToken } = useMapStore()
  const [editingHp, setEditingHp] = useState(false)
  const [hpInput, setHpInput] = useState('')

  const currentHp = token.currentHp ?? 0
  const maxHp = token.maxHp ?? statBlock?.hp?.average ?? 0
  const hpPct = maxHp > 0 ? currentHp / maxHp : 1
  const hpColor = hpPct > 0.5 ? 'var(--success)' : hpPct > 0.25 ? 'var(--warning)' : 'var(--danger)'

  const scores = statBlock
    ? {
        STR: statBlock.str ?? 10,
        DEX: statBlock.dex ?? 10,
        CON: statBlock.con ?? 10,
        INT: statBlock.int ?? 10,
        WIS: statBlock.wis ?? 10,
        CHA: statBlock.cha ?? 10
      }
    : null

  function handleHpSubmit(): void {
    const val = parseInt(hpInput, 10)
    if (!isNaN(val)) updateToken(token.id, { currentHp: Math.max(0, Math.min(val, maxHp)) })
    setEditingHp(false)
  }

  const cr = statBlock?.cr
    ? typeof statBlock.cr === 'object'
      ? (statBlock.cr as { cr: string }).cr
      : String(statBlock.cr)
    : null

  const acVal = statBlock?.ac?.[0]?.ac

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>STATS</p>

        {/* HP */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Hit Points</span>
            {editingHp ? (
              <form onSubmit={(e) => { e.preventDefault(); handleHpSubmit() }} className="flex gap-1">
                <input
                  type="number"
                  value={hpInput}
                  onChange={(e) => setHpInput(e.target.value)}
                  className="w-16 text-xs px-1 rounded"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--accent)' }}
                  autoFocus
                  onBlur={handleHpSubmit}
                />
              </form>
            ) : (
              <button
                onClick={() => { setHpInput(String(currentHp)); setEditingHp(true) }}
                className="text-xs font-bold"
                style={{ color: hpColor }}
              >
                {currentHp}/{maxHp}
              </button>
            )}
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, hpPct * 100))}%`, backgroundColor: hpColor }}
            />
          </div>
        </div>

        {/* AC, Speed, CR */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'AC', value: acVal ?? '—' },
            { label: 'Speed', value: statBlock?.speed?.walk ? `${statBlock.speed.walk}ft` : '—' },
            { label: 'CR', value: cr ?? '—' }
          ].map((s) => (
            <div key={s.label} className="text-center p-1.5 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{String(s.value)}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ability scores */}
        {scores && (
          <div className="grid grid-cols-6 gap-1 mt-2">
            {Object.entries(scores).map(([abbr, score]) => (
              <div key={abbr} className="text-center p-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{abbr}</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{score}</p>
                <p className="text-xs" style={{ color: 'var(--accent)' }}>{abilityMod(score)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureList({ features }: { features: MonsterFeature[] }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {features.map((f, i) => (
        <div key={i}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {f.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {renderEntries(f.entries)}
          </p>
        </div>
      ))}
    </div>
  )
}

function ActionsColumn({ statBlock }: { statBlock?: MonsterStatBlock }): React.ReactElement {
  if (!statBlock) return <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No stat block</p>

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {statBlock.action && statBlock.action.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>ACTIONS</p>
          <FeatureList features={statBlock.action} />
        </div>
      )}
      {statBlock.bonus && statBlock.bonus.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>BONUS ACTIONS</p>
          <FeatureList features={statBlock.bonus} />
        </div>
      )}
      {statBlock.reaction && statBlock.reaction.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>REACTIONS</p>
          <FeatureList features={statBlock.reaction} />
        </div>
      )}
      {statBlock.legendary && statBlock.legendary.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>LEGENDARY ACTIONS</p>
          <FeatureList features={statBlock.legendary} />
        </div>
      )}
      {statBlock.trait && statBlock.trait.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>TRAITS</p>
          <FeatureList features={statBlock.trait} />
        </div>
      )}
    </div>
  )
}

function SpellsColumn({ statBlock }: { statBlock?: MonsterStatBlock }): React.ReactElement {
  if (!statBlock?.spellcasting || statBlock.spellcasting.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        <p className="text-xs">Not a spellcaster</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto flex flex-col gap-4">
      {statBlock.spellcasting.map((sc, i) => (
        <div key={i}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            {sc.name.toUpperCase()}
          </p>
          {sc.headerEntries?.map((h, hi) => (
            <p key={hi} className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              {h}
            </p>
          ))}
          {sc.will && sc.will.length > 0 && (
            <div className="mb-2">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>At will:</p>
              {sc.will.map((s, si) => (
                <span key={si} className="inline-block text-xs px-1.5 py-0.5 rounded mr-1 mb-1" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          {sc.spells && Object.entries(sc.spells).map(([level, slot]) => (
            <div key={level} className="mb-2">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Level {level}{slot.slots ? ` (${slot.slots} slots)` : ''}:
              </p>
              {slot.spells.map((s, si) => (
                <span key={si} className="inline-block text-xs px-1.5 py-0.5 rounded mr-1 mb-1" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function TokenPanel(): React.ReactElement | null {
  const token = useSelectedToken()
  const { mapData } = useMapStore()

  if (!token) return null

  const monsterInstance = token.monsterInstanceId
    ? mapData?.monsterInstances.find((m) => m.id === token.monsterInstanceId)
    : null
  const statBlock = monsterInstance?.statBlock

  const typeColors: Record<string, string> = {
    player: '#7c3aed',
    monster: '#dc2626',
    npc: '#0891b2'
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        height: 240,
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '2px solid var(--border)'
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: typeColors[token.type] }}
        />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {token.name}
        </span>
        <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
          {token.type}
        </span>
        {statBlock?.type && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ·{' '}
            {typeof statBlock.type === 'object'
              ? (statBlock.type as { type: string }).type
              : statBlock.type}
          </span>
        )}
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden divide-x" style={{ borderColor: 'var(--border)' }}>
        <div className="flex-1 p-3 overflow-y-auto">
          <StatsColumn token={token} statBlock={statBlock} />
        </div>
        <div className="flex-1 p-3 overflow-y-auto" style={{ borderLeft: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>ACTIONS</p>
          <ActionsColumn statBlock={statBlock} />
        </div>
        <div className="flex-1 p-3 overflow-y-auto" style={{ borderLeft: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>SPELLS</p>
          <SpellsColumn statBlock={statBlock} />
        </div>
      </div>
    </div>
  )
}
