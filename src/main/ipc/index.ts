import { app, ipcMain } from 'electron'
import { IPC } from './channels'
import { registerCampaignHandlers } from './campaign.handlers'
import { registerScenarioHandlers } from './scenario.handlers'
import { registerMapHandlers } from './map.handlers'
import { registerBestiaryHandlers } from './bestiary.handlers'
import { registerDialogHandlers } from './dialog.handlers'
import { StorageService } from '../services/storage.service'
import { ImageService } from '../services/image.service'
import { BestiaryService } from '../services/bestiary.service'

export function registerAllHandlers(): void {
  const storage = new StorageService()
  const image = new ImageService()
  const bestiary = new BestiaryService()

  registerCampaignHandlers(storage)
  registerScenarioHandlers(storage)
  registerMapHandlers(storage, image)
  registerBestiaryHandlers(bestiary)
  registerDialogHandlers()

  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())
  ipcMain.handle(IPC.APP_GET_DATA_PATH, () => app.getPath('userData'))
}
