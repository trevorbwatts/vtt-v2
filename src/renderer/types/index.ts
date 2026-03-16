import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Token {
  id: string
  name: string
  type: 'player' | 'enemy' | 'npc'
  x: number
  y: number
  color: string
  hidden?: boolean
  combatantId?: string
}

export interface ClassDefinition {
  name: string
  level: number
  subclass?: string
}

export interface MonsterAction {
  name: string
  desc: string
}

export interface Monster {
  id: string
  name: string
  hp: number
  ac: number
  type: string
  cr: string
  description: string
  actions: MonsterAction[]
  stats: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
}

export interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
  ac: number
  type: 'player' | 'enemy' | 'npc'
  species?: string
  speed?: number
  darkvision?: number
  classes?: ClassDefinition[]
  dndBeyondId?: string
  description?: string
  stats?: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  actions?: MonsterAction[]
  spells?: { name: string; level: number; desc: string }[]
}

export type MapNoteType = 'treasure' | 'quote' | 'combat' | 'info' | 'trap'

export interface MapNote {
  id: string
  type: MapNoteType
  content: string
  x: number
  y: number
}

export interface Scenario {
  id: string
  name: string
  notes: string
  mapNotes: MapNote[]
  tokens: Token[]
  combatants: Combatant[]
  activeCombatants: Combatant[]
  mapImage?: string
}

export interface Campaign {
  id: string
  name: string
  players: Combatant[]
  npcs: Combatant[]
  persistentEnemies: Combatant[]
  scenarios: Scenario[]
}
