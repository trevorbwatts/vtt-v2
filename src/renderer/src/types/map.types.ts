import type { Condition } from './campaign.types'
import type { MonsterStatBlock } from './bestiary.types'

export type MapFormat = 'image' | 'uvtt' | 'dd2vtt'
export type MapMode = 'setup' | 'play'
export type TokenType = 'player' | 'monster' | 'npc'
export type NoteVisibility = 'dm' | 'shared'
export type NoteIcon = 'note' | 'treasure' | 'quote' | 'danger' | 'location' | 'quest'

export interface GridConfig {
  /** Pixels per grid cell. Default: 96 (1 inch at 96 DPI) */
  cellSize: number
  offsetX: number
  offsetY: number
  visible: boolean
  color: string
  snapToGrid: boolean
}

// --- UVTT / DD2VTT ---

export interface UVTTPoint {
  x: number
  y: number
}

export type UVTTLineSegment = [UVTTPoint, UVTTPoint]

export interface UVTTPortal {
  position: UVTTPoint
  bounds: [UVTTPoint, UVTTPoint]
  rotation: number
  closed: boolean
  freestanding: boolean
}

export interface UVTTLight {
  position: UVTTPoint
  range: number
  intensity: number
  color: string
  shadows: boolean
}

export interface UVTTResolution {
  map_origin: UVTTPoint
  map_size: UVTTPoint
  pixels_per_grid: number
}

export interface UVTTData {
  format: number
  resolution: UVTTResolution
  line_of_sight: UVTTLineSegment[]
  objects_line_of_sight?: UVTTLineSegment[]
  portals: UVTTPortal[]
  lights: UVTTLight[]
  environment?: {
    baked_lighting: boolean
    ambient_light: string
  }
}

// --- Monster Instances ---

export interface MonsterInstance {
  id: string
  statBlock: MonsterStatBlock
}

// --- Tokens ---

export interface TokenInstance {
  id: string
  type: TokenType
  playerCharacterId?: string
  monsterInstanceId?: string
  name: string
  /** Position in map-space pixels */
  x: number
  y: number
  /** Token diameter in grid cells. Default: 1 */
  sizeInCells: number
  tokenImagePath?: string
  conditions: Condition[]
  currentHp?: number
  maxHp?: number
  initiative?: number
  /** DM can hide tokens from player view */
  visible: boolean
}

// --- Notes ---

export interface MapNote {
  id: string
  x: number
  y: number
  title: string
  content: string
  visibility: NoteVisibility
  icon: NoteIcon
  color?: string
}

// --- Map ---

export interface MapData {
  id: string
  scenarioId: string
  name: string
  format: MapFormat
  /** Absolute path to the copied image file in appData */
  imagePath: string
  sourceFilePath?: string
  gridConfig: GridConfig
  mode: MapMode
  tokens: TokenInstance[]
  monsterInstances: MonsterInstance[]
  notes: MapNote[]
  uvttData?: UVTTData
  createdAt: string
  updatedAt: string
}

// --- Scenario ---

export interface Scenario {
  id: string
  campaignId: string
  name: string
  description?: string
  maps: MapData[]
  createdAt: string
  updatedAt: string
}
