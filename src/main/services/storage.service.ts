import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { nanoid } from 'nanoid'
import type { Campaign, PlayerCharacter } from '../../renderer/src/types/campaign.types'
import type { Scenario, MapData } from '../../renderer/src/types/map.types'

export class StorageService {
  private base: string

  constructor() {
    this.base = app.getPath('userData')
  }

  // --- Path helpers ---

  private campaignsDir(): string {
    return path.join(this.base, 'campaigns')
  }

  private campaignDir(id: string): string {
    return path.join(this.campaignsDir(), id)
  }

  private campaignFile(id: string): string {
    return path.join(this.campaignDir(id), 'campaign.json')
  }

  private scenarioDir(campaignId: string, scenarioId: string): string {
    return path.join(this.campaignDir(campaignId), 'scenarios', scenarioId)
  }

  private scenarioFile(campaignId: string, scenarioId: string): string {
    return path.join(this.scenarioDir(campaignId, scenarioId), 'scenario.json')
  }

  private mapDir(campaignId: string, scenarioId: string, mapId: string): string {
    return path.join(this.scenarioDir(campaignId, scenarioId), 'maps', mapId)
  }

  private mapFile(campaignId: string, scenarioId: string, mapId: string): string {
    return path.join(this.mapDir(campaignId, scenarioId, mapId), 'map.json')
  }

  public mapImageDir(campaignId: string, scenarioId: string, mapId: string): string {
    return this.mapDir(campaignId, scenarioId, mapId)
  }

  public tokensDir(): string {
    return path.join(this.base, 'tokens')
  }

  // --- Validation ---

  private assertWithinBase(filePath: string): void {
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(path.resolve(this.base))) {
      throw new Error(`Path outside app data: ${filePath}`)
    }
  }

  // --- Utilities ---

  private async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true })
  }

  private async readJson<T>(filePath: string): Promise<T> {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  }

  private async writeJson(filePath: string, data: unknown): Promise<void> {
    await this.ensureDir(path.dirname(filePath))
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  // --- Campaign ---

  async listCampaigns(): Promise<Campaign[]> {
    await this.ensureDir(this.campaignsDir())
    let entries: string[]
    try {
      entries = await fs.readdir(this.campaignsDir())
    } catch {
      return []
    }

    const campaigns: Campaign[] = []
    for (const entry of entries) {
      const file = this.campaignFile(entry)
      try {
        const campaign = await this.readJson<Campaign>(file)
        campaigns.push(campaign)
      } catch {
        // Skip malformed entries
      }
    }
    return campaigns.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.readJson<Campaign>(this.campaignFile(id))
  }

  async createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const now = new Date().toISOString()
    const campaign: Campaign = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now
    }
    await this.writeJson(this.campaignFile(campaign.id), campaign)
    return campaign
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const existing = await this.getCampaign(id)
    const updated: Campaign = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString()
    }
    await this.writeJson(this.campaignFile(id), updated)
    return updated
  }

  async deleteCampaign(id: string): Promise<void> {
    await fs.rm(this.campaignDir(id), { recursive: true, force: true })
  }

  // --- Player Characters (stored in campaign.json) ---

  async addPlayerCharacter(campaignId: string, pc: Omit<PlayerCharacter, 'id'>): Promise<PlayerCharacter> {
    const campaign = await this.getCampaign(campaignId)
    const newPc: PlayerCharacter = { ...pc, id: nanoid() }
    campaign.playerCharacters.push(newPc)
    await this.updateCampaign(campaignId, { playerCharacters: campaign.playerCharacters })
    return newPc
  }

  async updatePlayerCharacter(campaignId: string, pcId: string, data: Partial<PlayerCharacter>): Promise<void> {
    const campaign = await this.getCampaign(campaignId)
    campaign.playerCharacters = campaign.playerCharacters.map((pc) =>
      pc.id === pcId ? { ...pc, ...data } : pc
    )
    await this.updateCampaign(campaignId, { playerCharacters: campaign.playerCharacters })
  }

  async deletePlayerCharacter(campaignId: string, pcId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId)
    campaign.playerCharacters = campaign.playerCharacters.filter((pc) => pc.id !== pcId)
    await this.updateCampaign(campaignId, { playerCharacters: campaign.playerCharacters })
  }

  // --- Scenario ---

  async listScenarios(campaignId: string): Promise<Scenario[]> {
    const campaign = await this.getCampaign(campaignId)
    const scenarios: Scenario[] = []
    for (const scenarioId of campaign.scenarioIds) {
      try {
        const scenario = await this.readJson<Scenario>(this.scenarioFile(campaignId, scenarioId))
        scenarios.push(scenario)
      } catch {
        // Skip missing scenarios
      }
    }
    return scenarios
  }

  async getScenario(campaignId: string, scenarioId: string): Promise<Scenario> {
    return this.readJson<Scenario>(this.scenarioFile(campaignId, scenarioId))
  }

  async createScenario(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario> {
    const now = new Date().toISOString()
    const scenario: Scenario = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now
    }
    await this.writeJson(this.scenarioFile(scenario.campaignId, scenario.id), scenario)

    // Register in campaign
    const campaign = await this.getCampaign(scenario.campaignId)
    if (!campaign.scenarioIds.includes(scenario.id)) {
      campaign.scenarioIds.push(scenario.id)
      await this.updateCampaign(scenario.campaignId, { scenarioIds: campaign.scenarioIds })
    }
    return scenario
  }

  async updateScenario(campaignId: string, scenarioId: string, data: Partial<Scenario>): Promise<Scenario> {
    const existing = await this.getScenario(campaignId, scenarioId)
    const updated: Scenario = {
      ...existing,
      ...data,
      id: scenarioId,
      campaignId,
      updatedAt: new Date().toISOString()
    }
    await this.writeJson(this.scenarioFile(campaignId, scenarioId), updated)
    return updated
  }

  async deleteScenario(campaignId: string, scenarioId: string): Promise<void> {
    await fs.rm(this.scenarioDir(campaignId, scenarioId), { recursive: true, force: true })
    const campaign = await this.getCampaign(campaignId)
    campaign.scenarioIds = campaign.scenarioIds.filter((id) => id !== scenarioId)
    await this.updateCampaign(campaignId, { scenarioIds: campaign.scenarioIds })
  }

  // --- Map ---

  async getMap(campaignId: string, scenarioId: string, mapId: string): Promise<MapData> {
    return this.readJson<MapData>(this.mapFile(campaignId, scenarioId, mapId))
  }

  async saveMap(campaignId: string, scenarioId: string, mapId: string, data: MapData): Promise<MapData> {
    const updated: MapData = { ...data, updatedAt: new Date().toISOString() }
    await this.writeJson(this.mapFile(campaignId, scenarioId, mapId), updated)
    return updated
  }

  async createMap(campaignId: string, scenarioId: string, mapData: MapData): Promise<MapData> {
    await this.writeJson(this.mapFile(campaignId, scenarioId, mapData.id), mapData)

    // Register in scenario
    const scenario = await this.getScenario(campaignId, scenarioId)
    if (!scenario.maps.find((m) => m.id === mapData.id)) {
      scenario.maps.push(mapData)
      await this.updateScenario(campaignId, scenarioId, { maps: scenario.maps })
    }
    return mapData
  }

  async updateMap(campaignId: string, scenarioId: string, mapId: string, data: Partial<MapData>): Promise<MapData> {
    const existing = await this.getMap(campaignId, scenarioId, mapId)
    const updated: MapData = {
      ...existing,
      ...data,
      id: mapId,
      updatedAt: new Date().toISOString()
    }
    await this.writeJson(this.mapFile(campaignId, scenarioId, mapId), updated)

    // Update reference in scenario
    const scenario = await this.getScenario(campaignId, scenarioId)
    scenario.maps = scenario.maps.map((m) => (m.id === mapId ? updated : m))
    await this.updateScenario(campaignId, scenarioId, { maps: scenario.maps })

    return updated
  }

  async deleteMap(campaignId: string, scenarioId: string, mapId: string): Promise<void> {
    await fs.rm(this.mapDir(campaignId, scenarioId, mapId), { recursive: true, force: true })
    const scenario = await this.getScenario(campaignId, scenarioId)
    scenario.maps = scenario.maps.filter((m) => m.id !== mapId)
    await this.updateScenario(campaignId, scenarioId, { maps: scenario.maps })
  }

  async getImageUrl(absolutePath: string): Promise<string> {
    this.assertWithinBase(absolutePath)
    return `file://${absolutePath.replace(/\\/g, '/')}`
  }
}
