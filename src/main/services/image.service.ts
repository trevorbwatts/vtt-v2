import fs from 'fs/promises'
import path from 'path'
import type { UVTTData } from '../../renderer/src/types/map.types'

export class ImageService {
  /**
   * Copy an image file to the destination directory, returning the new path.
   */
  async copyImage(sourcePath: string, destDir: string, filename: string): Promise<string> {
    await fs.mkdir(destDir, { recursive: true })
    const destPath = path.join(destDir, filename)
    await fs.copyFile(sourcePath, destPath)
    return destPath
  }

  /**
   * Parse a UVTT or DD2VTT file.
   * Extracts the base64 image, writes it to destDir as image.png, and returns
   * { imagePath, uvttData }.
   */
  async parseUVTT(
    sourcePath: string,
    destDir: string
  ): Promise<{ imagePath: string; uvttData: UVTTData }> {
    const raw = await fs.readFile(sourcePath, 'utf-8')
    const json = JSON.parse(raw)

    // Extract base64 image (field name varies slightly between UVTT and DD2VTT)
    const base64Image: string = json.image || json.map_image || ''
    if (!base64Image) {
      throw new Error('UVTT file does not contain an embedded image')
    }

    // Strip data URI prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    await fs.mkdir(destDir, { recursive: true })
    const imagePath = path.join(destDir, 'image.png')
    await fs.writeFile(imagePath, imageBuffer)

    // Build UVTTData from the JSON
    const uvttData: UVTTData = {
      format: json.format ?? 0,
      resolution: json.resolution ?? {
        map_origin: { x: 0, y: 0 },
        map_size: { x: 0, y: 0 },
        pixels_per_grid: 70
      },
      line_of_sight: json.line_of_sight ?? [],
      objects_line_of_sight: json.objects_line_of_sight,
      portals: json.portals ?? [],
      lights: json.lights ?? [],
      environment: json.environment
    }

    return { imagePath, uvttData }
  }
}
