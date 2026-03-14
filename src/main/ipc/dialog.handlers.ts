import { ipcMain, dialog } from 'electron'
import { IPC } from './channels'

export function registerDialogHandlers(): void {
  ipcMain.handle(IPC.DIALOG_OPEN_IMAGE, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC.DIALOG_OPEN_TOKEN, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Token Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
