/**
 * Downloads bestiary data from the Open5e API and converts it to the
 * format expected by BestiaryService (grouped by first letter).
 *
 * Usage: node scripts/download-bestiary.mjs
 *
 * NOTE: This downloads SRD-licensed content from Open5e.
 * If you have a local copy of the 5e.tools data, see the
 * "Manual Setup" section at the bottom of this file.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '..', 'resources', 'bestiary')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const BASE_URL = 'https://api.open5e.com/v1/monsters/'
const PAGE_SIZE = 100

async function fetchAllMonsters() {
  const monsters = []
  let url = `${BASE_URL}?limit=${PAGE_SIZE}&format=json`
  let page = 1

  console.log('Downloading monsters from Open5e API...')

  while (url) {
    process.stdout.write(`  Page ${page}...`)
    const resp = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'vtt-v2/0.1.0' }
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status} from ${url}`)
    const data = await resp.json()
    monsters.push(...data.results)
    url = data.next
    page++
    process.stdout.write(` ${data.results.length} monsters\n`)
  }

  console.log(`\nTotal: ${monsters.length} monsters downloaded`)
  return monsters
}

/**
 * Convert an Open5e monster to a minimal 5e.tools-compatible stat block.
 * We only include the fields our app actually renders.
 */
function convertMonster(m) {
  const cr = m.challenge_rating ?? '0'
  return {
    name: m.name,
    source: m.document__slug?.toUpperCase() ?? 'SRD',
    size: [m.size ? m.size[0].toUpperCase() : 'M'],
    type: m.type ?? 'beast',
    ac: m.armor_class ? [{ ac: m.armor_class, from: m.armor_desc ? [m.armor_desc] : [] }] : [],
    hp: {
      average: m.hit_points ?? 0,
      formula: m.hit_dice ?? '0d6'
    },
    speed: parseSpeed(m.speed),
    str: m.strength ?? 10,
    dex: m.dexterity ?? 10,
    con: m.constitution ?? 10,
    int: m.intelligence ?? 10,
    wis: m.wisdom ?? 10,
    cha: m.charisma ?? 10,
    cr: String(cr),
    senses: m.senses ? [m.senses] : [],
    languages: m.languages ? [m.languages] : [],
    passive: m.perception ?? 10,
    trait: convertFeatures(m.special_abilities),
    action: convertFeatures(m.actions),
    reaction: convertFeatures(m.reactions),
    legendary: convertFeatures(m.legendary_actions),
    legendaryHeader: m.legendary_desc ? [m.legendary_desc] : [],
    spellcasting: convertSpellcasting(m)
  }
}

function parseSpeed(speed) {
  if (!speed) return { walk: 30 }
  // Open5e v1 returns speed as an object e.g. { walk: "30 ft.", fly: "60 ft." }
  if (typeof speed === 'object') {
    const result = {}
    for (const [key, val] of Object.entries(speed)) {
      const match = String(val).match(/(\d+)/)
      if (match) result[key] = parseInt(match[1])
    }
    return Object.keys(result).length > 0 ? result : { walk: 30 }
  }
  // Fallback: string parsing
  const speedStr = String(speed)
  const result = {}
  const walkMatch = speedStr.match(/(\d+)\s*ft/)
  if (walkMatch) result.walk = parseInt(walkMatch[1])
  const flyMatch = speedStr.match(/fly\s+(\d+)/)
  if (flyMatch) result.fly = parseInt(flyMatch[1])
  const swimMatch = speedStr.match(/swim\s+(\d+)/)
  if (swimMatch) result.swim = parseInt(swimMatch[1])
  const climbMatch = speedStr.match(/climb\s+(\d+)/)
  if (climbMatch) result.climb = parseInt(climbMatch[1])
  return result
}

function convertFeatures(arr) {
  if (!arr) return undefined
  return arr.map((f) => ({
    name: f.name ?? '',
    entries: [f.desc ?? '']
  }))
}

function convertSpellcasting(m) {
  // Open5e doesn't have structured spellcasting data in v1,
  // so we check special_abilities for spellcasting entries
  if (!m.special_abilities) return undefined
  const sc = m.special_abilities.find((a) =>
    a.name?.toLowerCase().includes('spellcasting') ||
    a.name?.toLowerCase().includes('innate spellcasting')
  )
  if (!sc) return undefined
  return [{ name: sc.name, headerEntries: [sc.desc] }]
}

async function main() {
  const monsters = await fetchAllMonsters()

  // Group by first letter of name
  const byLetter = {}
  for (const m of monsters) {
    const letter = m.name[0]?.toLowerCase() ?? 'a'
    if (!byLetter[letter]) byLetter[letter] = []
    byLetter[letter].push(convertMonster(m))
  }

  // Write one file per letter
  for (const [letter, letterMonsters] of Object.entries(byLetter)) {
    const filename = `bestiary-${letter}.json`
    const outPath = path.join(OUTPUT_DIR, filename)
    fs.writeFileSync(outPath, JSON.stringify({ monster: letterMonsters }, null, 2))
    console.log(`  Written: ${filename} (${letterMonsters.length} monsters)`)
  }

  console.log('\nDone! Bestiary data is in resources/bestiary/')
  console.log('\nNote: This is SRD content only (~400 monsters).')
  console.log('For full 5e.tools data (~3000 monsters), see "Manual Setup" below.')
}

main().catch((err) => {
  console.error('Download failed:', err.message)
  console.error('\nManual Setup:')
  console.error('  1. Go to https://5e.tools in your browser')
  console.error('  2. Open DevTools > Network, filter by "bestiary-"')
  console.error('  3. Reload the Bestiary page — the JSON files will appear')
  console.error('  4. Right-click each file > "Save as" into resources/bestiary/')
  console.error('  5. File names should be: bestiary-a.json, bestiary-b.json, ...')
  console.error('  6. 2024 monsters: bestiary-2024-a.json, bestiary-2024-b.json, ...')
  process.exit(1)
})
