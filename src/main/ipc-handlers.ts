import { ipcMain } from 'electron'
import { IPC } from '../shared/ipc-types'
import * as db from './database'
import * as storage from './file-storage'
import { fetchDnDBeyondCharacter } from './dndbeyond-proxy'

export function registerIpcHandlers(): void {
  // ── Campaigns ──
  ipcMain.handle(IPC.CAMPAIGNS_LIST, () => db.getCampaigns())
  ipcMain.handle(IPC.CAMPAIGNS_CREATE, (_, name: string) => db.createCampaign(name))
  ipcMain.handle(IPC.CAMPAIGNS_UPDATE, (_, id: string, name: string) => db.updateCampaign(id, name))
  ipcMain.handle(IPC.CAMPAIGNS_DELETE, (_, id: string) => db.deleteCampaign(id))

  // ── Scenarios ──
  ipcMain.handle(IPC.SCENARIOS_LIST, (_, campaignId: string) => db.getScenarios(campaignId))
  ipcMain.handle(IPC.SCENARIOS_CREATE, (_, campaignId: string, name: string) => db.createScenario(campaignId, name))
  ipcMain.handle(IPC.SCENARIOS_UPDATE, (_, id: string, data: Record<string, unknown>) => db.updateScenario(id, data))
  ipcMain.handle(IPC.SCENARIOS_DELETE, (_, id: string) => db.deleteScenario(id))

  // ── Combatants ──
  ipcMain.handle(IPC.COMBATANTS_LIST, (_, campaignId: string) => db.getCombatants(campaignId))
  ipcMain.handle(IPC.COMBATANTS_UPSERT, (_, campaignId: string, data: Record<string, unknown>) => db.upsertCombatant(campaignId, data))
  ipcMain.handle(IPC.COMBATANTS_DELETE, (_, id: string) => db.deleteCombatant(id))

  // ── Tokens ──
  ipcMain.handle(IPC.TOKENS_LIST, (_, scenarioId: string) => db.getTokens(scenarioId))
  ipcMain.handle(IPC.TOKENS_UPSERT, (_, scenarioId: string, data: Record<string, unknown>) => db.upsertToken(scenarioId, data))
  ipcMain.handle(IPC.TOKENS_DELETE, (_, id: string) => db.deleteToken(id))
  ipcMain.handle(IPC.TOKENS_BULK_UPSERT, (_, scenarioId: string, tokens: Record<string, unknown>[]) => db.bulkUpsertTokens(scenarioId, tokens))

  // ── Map Notes ──
  ipcMain.handle(IPC.MAP_NOTES_LIST, (_, scenarioId: string) => db.getMapNotes(scenarioId))
  ipcMain.handle(IPC.MAP_NOTES_UPSERT, (_, scenarioId: string, data: Record<string, unknown>) => db.upsertMapNote(scenarioId, data))
  ipcMain.handle(IPC.MAP_NOTES_DELETE, (_, id: string) => db.deleteMapNote(id))

  // ── Active Combat ──
  ipcMain.handle(IPC.ACTIVE_COMBAT_LIST, (_, scenarioId: string) => db.getActiveCombatants(scenarioId))
  ipcMain.handle(IPC.ACTIVE_COMBAT_UPSERT, (_, scenarioId: string, data: Record<string, unknown>) => db.upsertActiveCombatant(scenarioId, data))
  ipcMain.handle(IPC.ACTIVE_COMBAT_BULK_SET, (_, scenarioId: string, combatants: Record<string, unknown>[]) => db.bulkSetActiveCombatants(scenarioId, combatants))
  ipcMain.handle(IPC.ACTIVE_COMBAT_DELETE, (_, id: string) => db.deleteActiveCombatant(id))
  ipcMain.handle(IPC.ACTIVE_COMBAT_CLEAR, (_, scenarioId: string) => db.clearActiveCombatants(scenarioId))

  // ── Map Images ──
  ipcMain.handle(IPC.MAP_UPLOAD, (_, scenarioId: string, buffer: ArrayBuffer, filename: string) => {
    return storage.saveMapImage(scenarioId, buffer, filename)
  })
  ipcMain.handle(IPC.MAP_GET_IMAGE, (_, path: string) => {
    return storage.loadMapImage(path)
  })

  // ── D&D Beyond ──
  ipcMain.handle(IPC.DNDBEYOND_FETCH, async (_, idOrUrl: string) => {
    try {
      return { success: true, data: await fetchDnDBeyondCharacter(idOrUrl) }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}
