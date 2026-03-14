import type { Campaign, PlayerCharacter } from './campaign.types'
import type { Scenario, MapData } from './map.types'
import type { MonsterIndexEntry, MonsterStatBlock, BestiaryEdition } from './bestiary.types'

interface ElectronAPI {
  campaign: {
    list(): Promise<Campaign[]>
    get(id: string): Promise<Campaign>
    create(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign>
    update(id: string, data: Partial<Campaign>): Promise<Campaign>
    delete(id: string): Promise<void>
    addPlayerCharacter(campaignId: string, pc: Omit<PlayerCharacter, 'id'>): Promise<PlayerCharacter>
    updatePlayerCharacter(campaignId: string, pcId: string, data: Partial<PlayerCharacter>): Promise<void>
    deletePlayerCharacter(campaignId: string, pcId: string): Promise<void>
  }
  scenario: {
    list(campaignId: string): Promise<Scenario[]>
    get(campaignId: string, scenarioId: string): Promise<Scenario>
    create(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario>
    update(campaignId: string, scenarioId: string, data: Partial<Scenario>): Promise<Scenario>
    delete(campaignId: string, scenarioId: string): Promise<void>
  }
  map: {
    import(campaignId: string, scenarioId: string): Promise<MapData | null>
    get(campaignId: string, scenarioId: string, mapId: string): Promise<MapData>
    update(campaignId: string, scenarioId: string, mapId: string, data: Partial<MapData>): Promise<MapData>
    delete(campaignId: string, scenarioId: string, mapId: string): Promise<void>
    getImageUrl(absolutePath: string): Promise<string>
  }
  bestiary: {
    getIndex(): Promise<MonsterIndexEntry[]>
    getByLetter(letter: string, edition: BestiaryEdition): Promise<MonsterStatBlock[]>
    getMonster(name: string, source: string): Promise<MonsterStatBlock | null>
  }
  dialog: {
    openImageFile(): Promise<string | null>
    openTokenImage(): Promise<string | null>
  }
  app: {
    getVersion(): Promise<string>
    getDataPath(): Promise<string>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export {}
