export type Condition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'

export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface PlayerCharacter {
  id: string
  name: string
  playerName?: string
  race: string
  class: string
  subclass?: string
  level: number
  maxHp: number
  currentHp: number
  tempHp: number
  armorClass: number
  speed: number
  initiative?: number
  proficiencyBonus: number
  abilityScores: AbilityScores
  savingThrows?: Partial<AbilityScores>
  skills?: Record<string, number>
  tokenImagePath?: string
  conditions: Condition[]
  notes?: string
  spellcastingClass?: string
  spellSaveDC?: number
  spellAttackBonus?: number
}

export interface Campaign {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  playerCharacters: PlayerCharacter[]
  scenarioIds: string[]
}
