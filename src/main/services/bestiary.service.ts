import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import type { MonsterIndexEntry, MonsterStatBlock, BestiaryFile, BestiaryEdition } from '../../renderer/src/types/bestiary.types'

export class BestiaryService {
  private index: MonsterIndexEntry[] | null = null
  private letterCache = new Map<string, MonsterStatBlock[]>()

  private get resourcesPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'bestiary')
    }
    return path.join(__dirname, '../../../resources/bestiary')
  }

  async getIndex(): Promise<MonsterIndexEntry[]> {
    if (this.index) return this.index

    let files: string[]
    try {
      files = await fs.readdir(this.resourcesPath)
    } catch {
      // No bestiary files yet
      this.index = []
      return []
    }

    const index: MonsterIndexEntry[] = []

    for (const file of files) {
      if (!file.endsWith('.json') || file.includes('fluff')) continue

      // Match bestiary-a.json or bestiary-2024-a.json
      const letterMatch = file.match(/^bestiary(?:-2024)?-([a-z])\.json$/)
      if (!letterMatch) continue

      const letterKey = letterMatch[1]
      const edition: BestiaryEdition = file.includes('2024') ? '2024' : '2014'

      try {
        const raw = await fs.readFile(path.join(this.resourcesPath, file), 'utf-8')
        const data: BestiaryFile = JSON.parse(raw)
        for (const m of data.monster) {
          const cr = typeof m.cr === 'object' && m.cr !== null && 'cr' in m.cr
            ? (m.cr as { cr: string }).cr
            : (m.cr as string | number | undefined)

          const type = typeof m.type === 'object' && m.type !== null
            ? (m.type as { type: string }).type
            : (m.type as string | undefined) ?? 'unknown'

          index.push({
            name: m.name,
            source: m.source,
            page: m.page,
            cr: cr,
            type,
            size: m.size,
            edition,
            letterKey
          })
        }
      } catch {
        // Skip malformed files
      }
    }

    this.index = index
    return index
  }

  async getByLetter(letter: string, edition: BestiaryEdition): Promise<MonsterStatBlock[]> {
    const cacheKey = `${edition}-${letter}`
    if (this.letterCache.has(cacheKey)) {
      return this.letterCache.get(cacheKey)!
    }

    const filename = edition === '2024'
      ? `bestiary-2024-${letter}.json`
      : `bestiary-${letter}.json`

    const filePath = path.join(this.resourcesPath, filename)
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const data: BestiaryFile = JSON.parse(raw)
      this.letterCache.set(cacheKey, data.monster)
      return data.monster
    } catch {
      return []
    }
  }

  async getMonster(name: string, source: string): Promise<MonsterStatBlock | null> {
    // Find the letter key from the index
    const index = await this.getIndex()
    const entry = index.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() && m.source === source
    )
    if (!entry) return null

    const monsters = await this.getByLetter(entry.letterKey, entry.edition)
    return monsters.find((m) => m.name === name && m.source === source) ?? null
  }
}
