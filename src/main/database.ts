import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'

let db: SqlJsDatabase
let dbPath: string

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()
  dbPath = join(app.getPath('userData'), 'vtt.db')

  // Ensure directory exists
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  runMigrations()
  save()
}

function save(): void {
  const data = db.export()
  writeFileSync(dbPath, Buffer.from(data))
}

function runMigrations(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS campaign_combatants (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('player', 'enemy', 'npc')),
      initiative INTEGER DEFAULT 0,
      hp INTEGER DEFAULT 10,
      max_hp INTEGER DEFAULT 10,
      ac INTEGER DEFAULT 10,
      species TEXT,
      speed INTEGER,
      darkvision INTEGER,
      description TEXT,
      dnd_beyond_id TEXT,
      classes TEXT DEFAULT '[]',
      stats TEXT DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
      actions TEXT DEFAULT '[]',
      spells TEXT DEFAULT '[]'
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      notes TEXT DEFAULT '',
      map_image_path TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      combatant_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('player', 'enemy', 'npc')),
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      color TEXT DEFAULT '#3b82f6',
      hidden INTEGER DEFAULT 0
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS scenario_combatants (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'enemy',
      initiative INTEGER DEFAULT 0,
      hp INTEGER DEFAULT 10,
      max_hp INTEGER DEFAULT 10,
      ac INTEGER DEFAULT 10,
      description TEXT,
      stats TEXT DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
      actions TEXT DEFAULT '[]'
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS active_combatants (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      source_combatant_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      initiative INTEGER DEFAULT 0,
      hp INTEGER DEFAULT 10,
      max_hp INTEGER DEFAULT 10,
      ac INTEGER DEFAULT 10,
      sort_order INTEGER DEFAULT 0
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS map_notes (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('treasure','quote','combat','info','trap')),
      content TEXT NOT NULL,
      x REAL DEFAULT 0,
      y REAL DEFAULT 0
    )
  `)
}

function uid(): string {
  return randomUUID()
}

/** Run a SELECT and return all rows as objects */
function queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql)
  stmt.bind(params as (string | number | null)[])
  const rows: Record<string, unknown>[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Record<string, unknown>)
  }
  stmt.free()
  return rows
}

/** Run a SELECT and return the first row as an object, or undefined */
function queryOne(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const rows = queryAll(sql, params)
  return rows[0]
}

/** Run an INSERT/UPDATE/DELETE */
function run(sql: string, params: unknown[] = []): void {
  db.run(sql, params as (string | number | null)[])
  save()
}

// ── Campaigns ──

export function getCampaigns() {
  return queryAll('SELECT * FROM campaigns ORDER BY updated_at DESC')
}

export function createCampaign(name: string) {
  const id = 'c-' + uid()
  run('INSERT INTO campaigns (id, name) VALUES (?, ?)', [id, name])
  return queryOne('SELECT * FROM campaigns WHERE id = ?', [id])
}

export function updateCampaign(id: string, name: string) {
  run("UPDATE campaigns SET name = ?, updated_at = datetime('now') WHERE id = ?", [name, id])
  return queryOne('SELECT * FROM campaigns WHERE id = ?', [id])
}

export function deleteCampaign(id: string) {
  run('DELETE FROM campaigns WHERE id = ?', [id])
}

// ── Scenarios ──

export function getScenarios(campaignId: string) {
  return queryAll('SELECT * FROM scenarios WHERE campaign_id = ? ORDER BY sort_order', [campaignId])
}

export function createScenario(campaignId: string, name: string) {
  const id = 's-' + uid()
  const maxOrder = queryOne('SELECT MAX(sort_order) as m FROM scenarios WHERE campaign_id = ?', [campaignId])
  const sortOrder = ((maxOrder?.m as number | null) ?? -1) + 1
  run('INSERT INTO scenarios (id, campaign_id, name, sort_order) VALUES (?, ?, ?, ?)', [id, campaignId, name, sortOrder])
  return queryOne('SELECT * FROM scenarios WHERE id = ?', [id])
}

export function updateScenario(id: string, data: Record<string, unknown>) {
  const allowed = ['name', 'notes', 'map_image_path', 'sort_order']
  const fields = Object.keys(data).filter(k => allowed.includes(k))
  if (fields.length === 0) return queryOne('SELECT * FROM scenarios WHERE id = ?', [id])
  const sets = fields.map(f => `${f} = ?`).join(', ')
  const values = fields.map(f => data[f])
  run(`UPDATE scenarios SET ${sets} WHERE id = ?`, [...values, id])
  return queryOne('SELECT * FROM scenarios WHERE id = ?', [id])
}

export function deleteScenario(id: string) {
  run('DELETE FROM scenarios WHERE id = ?', [id])
}

// ── Campaign Combatants ──

export function getCombatants(campaignId: string) {
  const rows = queryAll('SELECT * FROM campaign_combatants WHERE campaign_id = ?', [campaignId])
  return rows.map(parseCombatantRow)
}

export function upsertCombatant(campaignId: string, data: Record<string, unknown>) {
  const id = (data.id as string) || 'cb-' + uid()
  const existing = queryOne('SELECT id FROM campaign_combatants WHERE id = ?', [id])

  if (existing) {
    const allowed = ['name', 'type', 'initiative', 'hp', 'max_hp', 'ac', 'species', 'speed', 'darkvision', 'description', 'dnd_beyond_id', 'classes', 'stats', 'actions', 'spells']
    const fields = Object.keys(data).filter(k => allowed.includes(k))
    if (fields.length > 0) {
      const sets = fields.map(f => `${f} = ?`).join(', ')
      const values = fields.map(f => {
        const v = data[f]
        return typeof v === 'object' ? JSON.stringify(v) : v
      })
      run(`UPDATE campaign_combatants SET ${sets} WHERE id = ?`, [...values, id])
    }
  } else {
    run(`
      INSERT INTO campaign_combatants (id, campaign_id, name, type, initiative, hp, max_hp, ac, species, speed, darkvision, description, dnd_beyond_id, classes, stats, actions, spells)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      campaignId,
      data.name ?? 'New Combatant',
      data.type ?? 'player',
      data.initiative ?? 0,
      data.hp ?? 10,
      data.max_hp ?? 10,
      data.ac ?? 10,
      data.species ?? null,
      data.speed ?? null,
      data.darkvision ?? null,
      data.description ?? null,
      data.dnd_beyond_id ?? null,
      JSON.stringify(data.classes ?? []),
      JSON.stringify(data.stats ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
      JSON.stringify(data.actions ?? []),
      JSON.stringify(data.spells ?? [])
    ])
  }

  const row = queryOne('SELECT * FROM campaign_combatants WHERE id = ?', [id])!
  return parseCombatantRow(row)
}

export function deleteCombatant(id: string) {
  run('DELETE FROM campaign_combatants WHERE id = ?', [id])
}

// ── Tokens ──

export function getTokens(scenarioId: string) {
  const rows = queryAll('SELECT * FROM tokens WHERE scenario_id = ?', [scenarioId])
  return rows.map(r => ({ ...r, hidden: !!(r.hidden as number) }))
}

export function upsertToken(scenarioId: string, data: Record<string, unknown>) {
  const id = (data.id as string) || 't-' + uid()
  const existing = queryOne('SELECT id FROM tokens WHERE id = ?', [id])

  if (existing) {
    const allowed = ['name', 'type', 'x', 'y', 'color', 'hidden', 'combatant_id']
    const fields = Object.keys(data).filter(k => allowed.includes(k))
    if (fields.length > 0) {
      const sets = fields.map(f => `${f} = ?`).join(', ')
      const values = fields.map(f => {
        if (f === 'hidden') return data[f] ? 1 : 0
        return data[f]
      })
      run(`UPDATE tokens SET ${sets} WHERE id = ?`, [...values, id])
    }
  } else {
    run(`
      INSERT INTO tokens (id, scenario_id, combatant_id, name, type, x, y, color, hidden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, scenarioId,
      data.combatant_id ?? null,
      data.name ?? 'Token',
      data.type ?? 'player',
      data.x ?? 0,
      data.y ?? 0,
      data.color ?? '#3b82f6',
      data.hidden ? 1 : 0
    ])
  }

  const row = queryOne('SELECT * FROM tokens WHERE id = ?', [id])!
  return { ...row, hidden: !!(row.hidden as number) }
}

export function deleteToken(id: string) {
  run('DELETE FROM tokens WHERE id = ?', [id])
}

export function bulkUpsertTokens(scenarioId: string, tokens: Record<string, unknown>[]) {
  for (const t of tokens) {
    const id = (t.id as string) || 't-' + uid()
    const existing = queryOne('SELECT id FROM tokens WHERE id = ?', [id])
    if (existing) {
      run('UPDATE tokens SET x = ?, y = ?, hidden = ?, name = ?, color = ? WHERE id = ?', [
        t.x ?? 0, t.y ?? 0, t.hidden ? 1 : 0, t.name ?? 'Token', t.color ?? '#3b82f6', id
      ])
    } else {
      run(`
        INSERT INTO tokens (id, scenario_id, combatant_id, name, type, x, y, color, hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, scenarioId, t.combatant_id ?? null,
        t.name ?? 'Token', t.type ?? 'player',
        t.x ?? 0, t.y ?? 0, t.color ?? '#3b82f6', t.hidden ? 1 : 0
      ])
    }
  }
  save()
  return getTokens(scenarioId)
}

// ── Map Notes ──

export function getMapNotes(scenarioId: string) {
  return queryAll('SELECT * FROM map_notes WHERE scenario_id = ?', [scenarioId])
}

export function upsertMapNote(scenarioId: string, data: Record<string, unknown>) {
  const id = (data.id as string) || 'mn-' + uid()
  const existing = queryOne('SELECT id FROM map_notes WHERE id = ?', [id])

  if (existing) {
    const allowed = ['type', 'content', 'x', 'y']
    const fields = Object.keys(data).filter(k => allowed.includes(k))
    if (fields.length > 0) {
      const sets = fields.map(f => `${f} = ?`).join(', ')
      const values = fields.map(f => data[f])
      run(`UPDATE map_notes SET ${sets} WHERE id = ?`, [...values, id])
    }
  } else {
    run(`
      INSERT INTO map_notes (id, scenario_id, type, content, x, y)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, scenarioId, data.type ?? 'info', data.content ?? '', data.x ?? 0, data.y ?? 0])
  }

  return queryOne('SELECT * FROM map_notes WHERE id = ?', [id])
}

export function deleteMapNote(id: string) {
  run('DELETE FROM map_notes WHERE id = ?', [id])
}

// ── Active Combatants ──

export function getActiveCombatants(scenarioId: string) {
  return queryAll('SELECT * FROM active_combatants WHERE scenario_id = ? ORDER BY sort_order', [scenarioId])
}

export function upsertActiveCombatant(scenarioId: string, data: Record<string, unknown>) {
  const id = (data.id as string) || 'ac-' + uid()
  const existing = queryOne('SELECT id FROM active_combatants WHERE id = ?', [id])

  if (existing) {
    const allowed = ['name', 'type', 'initiative', 'hp', 'max_hp', 'ac', 'sort_order']
    const fields = Object.keys(data).filter(k => allowed.includes(k))
    if (fields.length > 0) {
      const sets = fields.map(f => `${f} = ?`).join(', ')
      const values = fields.map(f => data[f])
      run(`UPDATE active_combatants SET ${sets} WHERE id = ?`, [...values, id])
    }
  } else {
    run(`
      INSERT INTO active_combatants (id, scenario_id, source_combatant_id, name, type, initiative, hp, max_hp, ac, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, scenarioId, data.source_combatant_id ?? null,
      data.name ?? 'Combatant', data.type ?? 'enemy',
      data.initiative ?? 0, data.hp ?? 10, data.max_hp ?? 10, data.ac ?? 10,
      data.sort_order ?? 0
    ])
  }

  return queryOne('SELECT * FROM active_combatants WHERE id = ?', [id])
}

export function bulkSetActiveCombatants(scenarioId: string, combatants: Record<string, unknown>[]) {
  run('DELETE FROM active_combatants WHERE scenario_id = ?', [scenarioId])
  combatants.forEach((c, i) => {
    run(`
      INSERT INTO active_combatants (id, scenario_id, source_combatant_id, name, type, initiative, hp, max_hp, ac, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      (c.id as string) || 'ac-' + uid(), scenarioId, c.source_combatant_id ?? null,
      c.name ?? 'Combatant', c.type ?? 'enemy',
      c.initiative ?? 0, c.hp ?? 10, c.max_hp ?? 10, c.ac ?? 10,
      i
    ])
  })
  return getActiveCombatants(scenarioId)
}

export function deleteActiveCombatant(id: string) {
  run('DELETE FROM active_combatants WHERE id = ?', [id])
}

export function clearActiveCombatants(scenarioId: string) {
  run('DELETE FROM active_combatants WHERE scenario_id = ?', [scenarioId])
}

// ── Helpers ──

function parseCombatantRow(row: Record<string, unknown>) {
  return {
    ...row,
    classes: parseJson(row.classes as string, []),
    stats: parseJson(row.stats as string, { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
    actions: parseJson(row.actions as string, []),
    spells: parseJson(row.spells as string, [])
  }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) } catch { return fallback }
}
