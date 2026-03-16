import { app } from 'electron'
import { join, extname } from 'path'
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'

function getMapsDir(): string {
  return join(app.getPath('userData'), 'maps')
}

export function saveMapImage(scenarioId: string, buffer: Buffer | ArrayBuffer, filename: string): string {
  const dir = join(getMapsDir(), scenarioId)
  mkdirSync(dir, { recursive: true })

  const ext = extname(filename) || '.png'
  const savedName = randomUUID() + ext
  const fullPath = join(dir, savedName)

  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  writeFileSync(fullPath, data)

  return `${scenarioId}/${savedName}`
}

export function loadMapImage(relativePath: string): string | null {
  const fullPath = join(getMapsDir(), relativePath)
  if (!existsSync(fullPath)) return null

  const data = readFileSync(fullPath)
  const ext = extname(relativePath).toLowerCase()
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.gif' ? 'image/gif'
    : 'image/png'

  return `data:${mime};base64,${data.toString('base64')}`
}

export function deleteMapImages(scenarioId: string): void {
  const dir = join(getMapsDir(), scenarioId)
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
  }
}
