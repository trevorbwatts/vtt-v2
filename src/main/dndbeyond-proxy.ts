interface DnDBeyondResult {
  name: string
  hp: number
  maxHp: number
  ac: number
  initiative: number
  type: 'player'
  species?: string
  speed?: number
  darkvision?: number
  classes?: { name: string; level: number; subclass?: string }[]
  stats?: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  dndBeyondId?: string
}

export async function fetchDnDBeyondCharacter(idOrUrl: string): Promise<DnDBeyondResult> {
  if (/\/campaigns\//.test(idOrUrl)) {
    throw new Error('CAMPAIGN_URL')
  }

  let characterId: string | null = null
  const urlMatch = idOrUrl.match(/\/characters\/(\d+)/)
  if (urlMatch) {
    characterId = urlMatch[1]
  } else if (/^\d+$/.test(idOrUrl)) {
    characterId = idOrUrl
  } else {
    const parts = idOrUrl.split('/')
    const last = parts[parts.length - 1]
    if (/^\d+$/.test(last)) {
      characterId = last
    }
  }

  if (!characterId) {
    throw new Error('INVALID_URL')
  }

  const url = `https://character-service.dndbeyond.com/character/v2/character/${characterId}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (res.status === 401 || res.status === 403 || res.status === 404) {
    throw new Error('CHARACTER_PRIVATE')
  }

  if (!res.ok) {
    throw new Error('FETCH_FAILED')
  }

  const json = await res.json()
  if (!json.success && json.data === undefined) {
    throw new Error('CHARACTER_PRIVATE')
  }

  const data = json.data

  const statsArray: { id: number; value: number }[] = data.stats || []
  const statsMap: Record<number, number> = {}
  for (const s of statsArray) {
    statsMap[s.id] = s.value
  }

  const stats = {
    str: statsMap[1] || 10,
    dex: statsMap[2] || 10,
    con: statsMap[3] || 10,
    int: statsMap[4] || 10,
    wis: statsMap[5] || 10,
    cha: statsMap[6] || 10
  }

  const dexMod = Math.floor((stats.dex - 10) / 2)

  let initBonus = 0
  if (data.modifiers?.race) {
    for (const mod of data.modifiers.race) {
      if (mod.type === 'bonus' && mod.subType === 'initiative') {
        initBonus += mod.value || 0
      }
    }
  }

  const baseHp = data.baseHitPoints || 0
  const bonusHp = data.bonusHitPoints || 0
  const removedHp = data.removedHitPoints || 0
  const overrideHp = data.overrideHitPoints
  const maxHp = overrideHp != null ? overrideHp : baseHp + bonusHp
  const hp = maxHp - removedHp

  const classes = (data.classes || []).map((c: { definition: { name: string }; level: number; subclassDefinition?: { name: string } }) => ({
    name: c.definition?.name || 'Unknown',
    level: c.level || 1,
    subclass: c.subclassDefinition?.name
  }))

  return {
    name: data.name || 'Imported Character',
    hp,
    maxHp,
    ac: 10 + dexMod,
    initiative: dexMod + initBonus,
    type: 'player',
    species: data.race?.fullName,
    speed: data.race?.weightSpeeds?.normal?.walk || 30,
    darkvision: 60,
    classes,
    stats,
    dndBeyondId: characterId
  }
}
