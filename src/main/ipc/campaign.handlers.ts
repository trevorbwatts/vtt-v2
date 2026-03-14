import { ipcMain } from 'electron'
import { IPC } from './channels'
import type { StorageService } from '../services/storage.service'
import type { Campaign, PlayerCharacter } from '../../renderer/src/types/campaign.types'

export function registerCampaignHandlers(storage: StorageService): void {
  ipcMain.handle(IPC.CAMPAIGN_LIST, () => storage.listCampaigns())

  ipcMain.handle(IPC.CAMPAIGN_GET, (_e, id: string) => storage.getCampaign(id))

  ipcMain.handle(
    IPC.CAMPAIGN_CREATE,
    (_e, data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) =>
      storage.createCampaign(data)
  )

  ipcMain.handle(
    IPC.CAMPAIGN_UPDATE,
    (_e, id: string, data: Partial<Campaign>) =>
      storage.updateCampaign(id, data)
  )

  ipcMain.handle(IPC.CAMPAIGN_DELETE, (_e, id: string) => storage.deleteCampaign(id))

  // Player character handlers (stored within campaign.json)
  ipcMain.handle(
    'campaign:add-pc',
    (_e, campaignId: string, pc: Omit<PlayerCharacter, 'id'>) =>
      storage.addPlayerCharacter(campaignId, pc)
  )

  ipcMain.handle(
    'campaign:update-pc',
    (_e, campaignId: string, pcId: string, data: Partial<PlayerCharacter>) =>
      storage.updatePlayerCharacter(campaignId, pcId, data)
  )

  ipcMain.handle(
    'campaign:delete-pc',
    (_e, campaignId: string, pcId: string) =>
      storage.deletePlayerCharacter(campaignId, pcId)
  )
}
