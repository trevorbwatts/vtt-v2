import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../main/ipc/channels'
import type { Campaign, PlayerCharacter } from '../renderer/src/types/campaign.types'
import type { Scenario, MapData } from '../renderer/src/types/map.types'
import type { MonsterIndexEntry, MonsterStatBlock, BestiaryEdition } from '../renderer/src/types/bestiary.types'

const api = {
  campaign: {
    list: (): Promise<Campaign[]> => ipcRenderer.invoke(IPC.CAMPAIGN_LIST),
    get: (id: string): Promise<Campaign> => ipcRenderer.invoke(IPC.CAMPAIGN_GET, id),
    create: (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> =>
      ipcRenderer.invoke(IPC.CAMPAIGN_CREATE, data),
    update: (id: string, data: Partial<Campaign>): Promise<Campaign> =>
      ipcRenderer.invoke(IPC.CAMPAIGN_UPDATE, id, data),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.CAMPAIGN_DELETE, id),

    addPlayerCharacter: (campaignId: string, pc: Omit<PlayerCharacter, 'id'>): Promise<PlayerCharacter> =>
      ipcRenderer.invoke('campaign:add-pc', campaignId, pc),
    updatePlayerCharacter: (campaignId: string, pcId: string, data: Partial<PlayerCharacter>): Promise<void> =>
      ipcRenderer.invoke('campaign:update-pc', campaignId, pcId, data),
    deletePlayerCharacter: (campaignId: string, pcId: string): Promise<void> =>
      ipcRenderer.invoke('campaign:delete-pc', campaignId, pcId)
  },

  scenario: {
    list: (campaignId: string): Promise<Scenario[]> =>
      ipcRenderer.invoke(IPC.SCENARIO_LIST, campaignId),
    get: (campaignId: string, scenarioId: string): Promise<Scenario> =>
      ipcRenderer.invoke(IPC.SCENARIO_GET, campaignId, scenarioId),
    create: (data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario> =>
      ipcRenderer.invoke(IPC.SCENARIO_CREATE, data),
    update: (campaignId: string, scenarioId: string, data: Partial<Scenario>): Promise<Scenario> =>
      ipcRenderer.invoke(IPC.SCENARIO_UPDATE, campaignId, scenarioId, data),
    delete: (campaignId: string, scenarioId: string): Promise<void> =>
      ipcRenderer.invoke(IPC.SCENARIO_DELETE, campaignId, scenarioId)
  },

  map: {
    import: (campaignId: string, scenarioId: string): Promise<MapData | null> =>
      ipcRenderer.invoke(IPC.MAP_IMPORT, campaignId, scenarioId),
    get: (campaignId: string, scenarioId: string, mapId: string): Promise<MapData> =>
      ipcRenderer.invoke(IPC.MAP_GET, campaignId, scenarioId, mapId),
    update: (campaignId: string, scenarioId: string, mapId: string, data: Partial<MapData>): Promise<MapData> =>
      ipcRenderer.invoke(IPC.MAP_UPDATE, campaignId, scenarioId, mapId, data),
    delete: (campaignId: string, scenarioId: string, mapId: string): Promise<void> =>
      ipcRenderer.invoke(IPC.MAP_DELETE, campaignId, scenarioId, mapId),
    getImageUrl: (absolutePath: string): Promise<string> =>
      ipcRenderer.invoke(IPC.MAP_GET_IMAGE_URL, absolutePath)
  },

  bestiary: {
    getIndex: (): Promise<MonsterIndexEntry[]> =>
      ipcRenderer.invoke(IPC.BESTIARY_GET_INDEX),
    getByLetter: (letter: string, edition: BestiaryEdition): Promise<MonsterStatBlock[]> =>
      ipcRenderer.invoke(IPC.BESTIARY_GET_LETTER, letter, edition),
    getMonster: (name: string, source: string): Promise<MonsterStatBlock | null> =>
      ipcRenderer.invoke(IPC.BESTIARY_GET_MONSTER, name, source)
  },

  dialog: {
    openImageFile: (): Promise<string | null> => ipcRenderer.invoke(IPC.DIALOG_OPEN_IMAGE),
    openTokenImage: (): Promise<string | null> => ipcRenderer.invoke(IPC.DIALOG_OPEN_TOKEN)
  },

  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_VERSION),
    getDataPath: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_DATA_PATH)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
