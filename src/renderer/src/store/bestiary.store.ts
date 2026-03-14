import { create } from 'zustand'
import type { MonsterIndexEntry, MonsterStatBlock, BestiaryEdition } from '../types/bestiary.types'

interface BestiaryStore {
  index: MonsterIndexEntry[]
  indexLoaded: boolean
  loading: boolean
  letterCache: Record<string, MonsterStatBlock[]>
  searchQuery: string
  searchResults: MonsterIndexEntry[]
  editionFilter: BestiaryEdition | 'all'
  typeFilter: string
  selectedMonster: MonsterStatBlock | null

  loadIndex: () => Promise<void>
  loadLetter: (letter: string, edition: BestiaryEdition) => Promise<MonsterStatBlock[]>
  selectMonster: (name: string, source: string, edition: BestiaryEdition) => Promise<void>
  setSearch: (query: string) => void
  setEditionFilter: (edition: BestiaryEdition | 'all') => void
  setTypeFilter: (type: string) => void
  clearSelected: () => void
}

function filterIndex(
  index: MonsterIndexEntry[],
  query: string,
  edition: BestiaryEdition | 'all',
  type: string
): MonsterIndexEntry[] {
  const q = query.toLowerCase()
  return index
    .filter((m) => {
      const matchesName = !q || m.name.toLowerCase().includes(q)
      const matchesEdition = edition === 'all' || m.edition === edition
      const matchesType = !type || m.type.toLowerCase() === type.toLowerCase()
      return matchesName && matchesEdition && matchesType
    })
    .slice(0, 150)
}

export const useBestiaryStore = create<BestiaryStore>((set, get) => ({
  index: [],
  indexLoaded: false,
  loading: false,
  letterCache: {},
  searchQuery: '',
  searchResults: [],
  editionFilter: 'all',
  typeFilter: '',
  selectedMonster: null,

  loadIndex: async () => {
    if (get().indexLoaded) return
    set({ loading: true })
    try {
      const index = await window.api.bestiary.getIndex()
      set({
        index,
        indexLoaded: true,
        loading: false,
        searchResults: filterIndex(index, '', 'all', '')
      })
    } catch (err) {
      console.error('Failed to load bestiary index:', err)
      set({ loading: false })
    }
  },

  loadLetter: async (letter, edition) => {
    const cacheKey = `${edition}-${letter}`
    const cached = get().letterCache[cacheKey]
    if (cached) return cached

    const monsters = await window.api.bestiary.getByLetter(letter, edition)
    set((s) => ({ letterCache: { ...s.letterCache, [cacheKey]: monsters } }))
    return monsters
  },

  selectMonster: async (name, source, edition) => {
    const entry = get().index.find((m) => m.name === name && m.source === source)
    if (!entry) return

    const monsters = await get().loadLetter(entry.letterKey, edition)
    const monster = monsters.find((m) => m.name === name && m.source === source) ?? null
    set({ selectedMonster: monster })
  },

  setSearch: (query) => {
    const { index, editionFilter, typeFilter } = get()
    set({
      searchQuery: query,
      searchResults: filterIndex(index, query, editionFilter, typeFilter)
    })
  },

  setEditionFilter: (edition) => {
    const { index, searchQuery, typeFilter } = get()
    set({
      editionFilter: edition,
      searchResults: filterIndex(index, searchQuery, edition, typeFilter)
    })
  },

  setTypeFilter: (type) => {
    const { index, searchQuery, editionFilter } = get()
    set({
      typeFilter: type,
      searchResults: filterIndex(index, searchQuery, editionFilter, type)
    })
  },

  clearSelected: () => set({ selectedMonster: null })
}))
