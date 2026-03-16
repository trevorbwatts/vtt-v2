import type { Monster } from '../types'

export const BESTIARY: Monster[] = [
  {
    id: 'm1',
    name: 'Goblin',
    hp: 7,
    ac: 15,
    type: 'Small Humanoid (Goblinoid)',
    cr: '1/4',
    description: 'Goblins are small, black-hearted humanoids that gather in overwhelming numbers.',
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    actions: [
      { name: 'Scimitar', desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.' },
      { name: 'Shortbow', desc: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.' }
    ]
  },
  {
    id: 'm2',
    name: 'Orc',
    hp: 15,
    ac: 13,
    type: 'Medium Humanoid (Orc)',
    cr: '1/2',
    description: "Orcs are savage humanoids with stooped postures, pig-like faces, and prominent lower canines that resemble a boar's tusks.",
    stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    actions: [
      { name: 'Greataxe', desc: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.' },
      { name: 'Javelin', desc: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.' }
    ]
  },
  {
    id: 'm3',
    name: 'Bugbear',
    hp: 27,
    ac: 16,
    type: 'Medium Humanoid (Goblinoid)',
    cr: '1',
    description: 'Bugbears are hairy giant-kin that live for few things besides soft beds and hot food.',
    stats: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    actions: [
      { name: 'Morningstar', desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) piercing damage.' },
      { name: 'Javelin', desc: 'Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 9 (2d6 + 2) piercing damage.' }
    ]
  },
  {
    id: 'm4',
    name: 'Ogre',
    hp: 59,
    ac: 11,
    type: 'Large Giant',
    cr: '2',
    description: 'Ogres are legendary for their size and strength, but also for their stupidity.',
    stats: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
    actions: [
      { name: 'Greatclub', desc: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.' },
      { name: 'Javelin', desc: 'Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 11 (2d6 + 4) piercing damage.' }
    ]
  },
  {
    id: 'm5',
    name: 'Owlbear',
    hp: 59,
    ac: 13,
    type: 'Large Monstrosity',
    cr: '3',
    description: "A monstrous cross between a giant owl and a bear, an owlbear's reputation for ferocity and aggression makes it one of the most feared predators of the wild.",
    stats: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    actions: [
      { name: 'Multiattack', desc: 'The owlbear makes two attacks: one with its beak and one with its claws.' },
      { name: 'Beak', desc: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d10 + 5) piercing damage.' },
      { name: 'Claws', desc: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.' }
    ]
  }
]
