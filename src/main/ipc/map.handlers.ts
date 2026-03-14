import { ipcMain, dialog } from 'electron'
import path from 'path'
import { nanoid } from 'nanoid'
import { IPC } from './channels'
import type { StorageService } from '../services/storage.service'
import type { ImageService } from '../services/image.service'
import type { MapData } from '../../renderer/src/types/map.types'

export function registerMapHandlers(storage: StorageService, image: ImageService): void {
  ipcMain.handle(
    IPC.MAP_IMPORT,
    async (_e, campaignId: string, scenarioId: string) => {
      const result = await dialog.showOpenDialog({
        title: 'Import Map',
        filters: [
          { name: 'Map Files', extensions: ['jpg', 'jpeg', 'png', 'uvtt', 'dd2vtt'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
          { name: 'VTT Files', extensions: ['uvtt', 'dd2vtt'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled || !result.filePaths[0]) return null

      const sourcePath = result.filePaths[0]
      const ext = path.extname(sourcePath).toLowerCase().slice(1)
      const mapId = nanoid()
      const destDir = storage.mapImageDir(campaignId, scenarioId, mapId)
      const now = new Date().toISOString()

      let imagePath: string
      let uvttData: import('../../renderer/src/types/map.types').UVTTData | undefined = undefined

      if (ext === 'uvtt' || ext === 'dd2vtt') {
        const parsed = await image.parseUVTT(sourcePath, destDir)
        imagePath = parsed.imagePath
        uvttData = parsed.uvttData
      } else {
        const imgExt = ext === 'jpeg' ? 'jpg' : ext
        imagePath = await image.copyImage(sourcePath, destDir, `image.${imgExt}`)
      }

      const mapData: MapData = {
        id: mapId,
        scenarioId,
        name: path.basename(sourcePath, path.extname(sourcePath)),
        format: (ext === 'uvtt' || ext === 'dd2vtt') ? ext : 'image',
        imagePath,
        sourceFilePath: sourcePath,
        gridConfig: {
          cellSize: uvttData ? uvttData.resolution.pixels_per_grid : 96,
          offsetX: uvttData ? uvttData.resolution.map_origin.x : 0,
          offsetY: uvttData ? uvttData.resolution.map_origin.y : 0,
          visible: true,
          color: '#ffffff33',
          snapToGrid: true
        },
        mode: 'setup',
        tokens: [],
        monsterInstances: [],
        notes: [],
        uvttData,
        createdAt: now,
        updatedAt: now
      }

      return storage.createMap(campaignId, scenarioId, mapData)
    }
  )

  ipcMain.handle(
    IPC.MAP_GET,
    (_e, campaignId: string, scenarioId: string, mapId: string) =>
      storage.getMap(campaignId, scenarioId, mapId)
  )

  ipcMain.handle(
    IPC.MAP_UPDATE,
    (_e, campaignId: string, scenarioId: string, mapId: string, data: Partial<MapData>) =>
      storage.updateMap(campaignId, scenarioId, mapId, data)
  )

  ipcMain.handle(
    IPC.MAP_DELETE,
    (_e, campaignId: string, scenarioId: string, mapId: string) =>
      storage.deleteMap(campaignId, scenarioId, mapId)
  )

  ipcMain.handle(
    IPC.MAP_GET_IMAGE_URL,
    (_e, absolutePath: string) => storage.getImageUrl(absolutePath)
  )
}
