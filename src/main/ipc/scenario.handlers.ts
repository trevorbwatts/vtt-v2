import { ipcMain } from 'electron'
import { IPC } from './channels'
import type { StorageService } from '../services/storage.service'
import type { Scenario } from '../../renderer/src/types/map.types'

export function registerScenarioHandlers(storage: StorageService): void {
  ipcMain.handle(IPC.SCENARIO_LIST, (_e, campaignId: string) =>
    storage.listScenarios(campaignId)
  )

  ipcMain.handle(IPC.SCENARIO_GET, (_e, campaignId: string, scenarioId: string) =>
    storage.getScenario(campaignId, scenarioId)
  )

  ipcMain.handle(
    IPC.SCENARIO_CREATE,
    (_e, data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) =>
      storage.createScenario(data)
  )

  ipcMain.handle(
    IPC.SCENARIO_UPDATE,
    (_e, campaignId: string, scenarioId: string, data: Partial<Scenario>) =>
      storage.updateScenario(campaignId, scenarioId, data)
  )

  ipcMain.handle(
    IPC.SCENARIO_DELETE,
    (_e, campaignId: string, scenarioId: string) =>
      storage.deleteScenario(campaignId, scenarioId)
  )
}
