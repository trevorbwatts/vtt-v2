export type BestiaryEdition = '2014' | '2024'

export interface MonsterIndexEntry {
  name: string
  source: string
  page?: number
  cr?: string | number
  type: string
  size?: string[]
  edition: BestiaryEdition
  /** Which letter-file this monster lives in, e.g. "a" */
  letterKey: string
}

export interface MonsterAC {
  ac: number
  from?: string[]
  condition?: string
}

export interface MonsterHP {
  average: number
  formula: string
}

export interface MonsterFeature {
  name: string
  entries: (string | object)[]
}

export interface MonsterSpellSlot {
  slots?: number
  spells: string[]
}

export interface MonsterSpellcasting {
  name: string
  type?: string
  ability?: string
  headerEntries?: string[]
  footerEntries?: string[]
  spells?: Record<string, MonsterSpellSlot>
  will?: string[]
  daily?: Record<string, string[]>
}

export interface MonsterTypeObject {
  type: string
  tags?: string[]
}

export interface MonsterStatBlock {
  name: string
  source: string
  page?: number
  size?: string[]
  type?: string | MonsterTypeObject
  alignment?: string[]
  ac?: MonsterAC[]
  hp?: MonsterHP
  speed?: Record<string, number | { number: number; condition: string } | boolean>
  str?: number
  dex?: number
  con?: number
  int?: number
  wis?: number
  cha?: number
  save?: Record<string, string>
  skill?: Record<string, string>
  immune?: (string | { immune: string[]; note?: string })[]
  resist?: (string | { resist: string[]; note?: string })[]
  vulnerable?: (string | { vulnerable: string[]; note?: string })[]
  conditionImmune?: (string | { conditionImmune: string[]; note?: string })[]
  senses?: string[]
  passive?: number
  languages?: string[]
  cr?: string | { cr: string; lair?: string; coven?: string }
  trait?: MonsterFeature[]
  action?: MonsterFeature[]
  bonus?: MonsterFeature[]
  reaction?: MonsterFeature[]
  legendary?: MonsterFeature[]
  mythic?: MonsterFeature[]
  legendaryHeader?: string[]
  spellcasting?: MonsterSpellcasting[]
  environment?: string[]
}

/** Raw shape of bestiary-x.json from 5e.tools */
export interface BestiaryFile {
  monster: MonsterStatBlock[]
}

/** A placed monster on the map — stat block snapshot at placement time */
export interface MonsterInstance {
  id: string
  sourceMonsterName: string
  source: string
  edition: BestiaryEdition
  statBlock: MonsterStatBlock
  currentHp: number
  maxHp: number
  conditions: string[]
  notes?: string
}
