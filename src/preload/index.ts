import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-types'

const api = {
  campaigns: {
    list: () => ipcRenderer.invoke(IPC.CAMPAIGNS_LIST),
    create: (name: string) => ipcRenderer.invoke(IPC.CAMPAIGNS_CREATE, name),
    update: (id: string, name: string) => ipcRenderer.invoke(IPC.CAMPAIGNS_UPDATE, id, name),
    delete: (id: string) => ipcRenderer.invoke(IPC.CAMPAIGNS_DELETE, id)
  },
  scenarios: {
    list: (campaignId: string) => ipcRenderer.invoke(IPC.SCENARIOS_LIST, campaignId),
    create: (campaignId: string, name: string) => ipcRenderer.invoke(IPC.SCENARIOS_CREATE, campaignId, name),
    update: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke(IPC.SCENARIOS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.SCENARIOS_DELETE, id)
  },
  combatants: {
    list: (campaignId: string) => ipcRenderer.invoke(IPC.COMBATANTS_LIST, campaignId),
    upsert: (campaignId: string, data: Record<string, unknown>) => ipcRenderer.invoke(IPC.COMBATANTS_UPSERT, campaignId, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.COMBATANTS_DELETE, id)
  },
  tokens: {
    list: (scenarioId: string) => ipcRenderer.invoke(IPC.TOKENS_LIST, scenarioId),
    upsert: (scenarioId: string, data: Record<string, unknown>) => ipcRenderer.invoke(IPC.TOKENS_UPSERT, scenarioId, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.TOKENS_DELETE, id),
    bulkUpsert: (scenarioId: string, tokens: Record<string, unknown>[]) => ipcRenderer.invoke(IPC.TOKENS_BULK_UPSERT, scenarioId, tokens)
  },
  mapNotes: {
    list: (scenarioId: string) => ipcRenderer.invoke(IPC.MAP_NOTES_LIST, scenarioId),
    upsert: (scenarioId: string, data: Record<string, unknown>) => ipcRenderer.invoke(IPC.MAP_NOTES_UPSERT, scenarioId, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.MAP_NOTES_DELETE, id)
  },
  activeCombat: {
    list: (scenarioId: string) => ipcRenderer.invoke(IPC.ACTIVE_COMBAT_LIST, scenarioId),
    upsert: (scenarioId: string, data: Record<string, unknown>) => ipcRenderer.invoke(IPC.ACTIVE_COMBAT_UPSERT, scenarioId, data),
    bulkSet: (scenarioId: string, combatants: Record<string, unknown>[]) => ipcRenderer.invoke(IPC.ACTIVE_COMBAT_BULK_SET, scenarioId, combatants),
    delete: (id: string) => ipcRenderer.invoke(IPC.ACTIVE_COMBAT_DELETE, id),
    clear: (scenarioId: string) => ipcRenderer.invoke(IPC.ACTIVE_COMBAT_CLEAR, scenarioId)
  },
  maps: {
    upload: (scenarioId: string, buffer: ArrayBuffer, filename: string) => ipcRenderer.invoke(IPC.MAP_UPLOAD, scenarioId, buffer, filename),
    getImage: (path: string) => ipcRenderer.invoke(IPC.MAP_GET_IMAGE, path)
  },
  dndbeyond: {
    fetchCharacter: (idOrUrl: string) => ipcRenderer.invoke(IPC.DNDBEYOND_FETCH, idOrUrl)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
