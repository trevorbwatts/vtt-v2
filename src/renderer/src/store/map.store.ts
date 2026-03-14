import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { MapData, TokenInstance, MonsterInstance, MapNote, MapMode } from '../types/map.types'

interface MapStore {
  mapData: MapData | null
  activeMapId: string | null
  selectedTokenId: string | null
  isDirty: boolean
  campaignId: string | null
  scenarioId: string | null

  loadMap: (campaignId: string, scenarioId: string, mapId: string) => Promise<void>
  saveMap: () => Promise<void>
  setMode: (mode: MapMode) => void
  updateMap: (data: Partial<MapData>) => void

  // Monster instances
  addMonsterInstance: (instance: MonsterInstance) => void

  // Tokens
  addToken: (token: Omit<TokenInstance, 'id'>) => void
  moveToken: (tokenId: string, x: number, y: number) => void
  updateToken: (tokenId: string, data: Partial<TokenInstance>) => void
  removeToken: (tokenId: string) => void
  setSelectedToken: (id: string | null) => void

  // Notes
  addNote: (note: Omit<MapNote, 'id'>) => void
  updateNote: (noteId: string, data: Partial<MapNote>) => void
  removeNote: (noteId: string) => void

  clearMap: () => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
const AUTOSAVE_DELAY = 1500

export const useMapStore = create<MapStore>((set, get) => {
  const scheduleSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      get().saveMap()
    }, AUTOSAVE_DELAY)
  }

  return {
    mapData: null,
    activeMapId: null,
    selectedTokenId: null,
    isDirty: false,
    campaignId: null,
    scenarioId: null,

    loadMap: async (campaignId, scenarioId, mapId) => {
      const raw = await window.api.map.get(campaignId, scenarioId, mapId)
      // Migrate older maps that don't have monsterInstances yet
      const mapData: MapData = { ...raw, monsterInstances: raw.monsterInstances ?? [] }
      set({ mapData, activeMapId: mapId, campaignId, scenarioId, isDirty: false, selectedTokenId: null })
    },

    saveMap: async () => {
      const { mapData, campaignId, scenarioId } = get()
      if (!mapData || !campaignId || !scenarioId) return
      try {
        await window.api.map.update(campaignId, scenarioId, mapData.id, mapData)
        set({ isDirty: false })
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    },

    setMode: (mode) => {
      set((s) => ({ mapData: s.mapData ? { ...s.mapData, mode } : null, isDirty: true }))
      scheduleSave()
    },

    updateMap: (data) => {
      set((s) => ({ mapData: s.mapData ? { ...s.mapData, ...data } : null, isDirty: true }))
      scheduleSave()
    },

    addMonsterInstance: (instance) => {
      set((s) => ({
        mapData: s.mapData
          ? { ...s.mapData, monsterInstances: [...s.mapData.monsterInstances, instance] }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    addToken: (token) => {
      const newToken: TokenInstance = { ...token, id: nanoid() }
      set((s) => ({
        mapData: s.mapData
          ? { ...s.mapData, tokens: [...s.mapData.tokens, newToken] }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    moveToken: (tokenId, x, y) => {
      set((s) => ({
        mapData: s.mapData
          ? {
              ...s.mapData,
              tokens: s.mapData.tokens.map((t) =>
                t.id === tokenId ? { ...t, x, y } : t
              )
            }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    updateToken: (tokenId, data) => {
      set((s) => ({
        mapData: s.mapData
          ? {
              ...s.mapData,
              tokens: s.mapData.tokens.map((t) =>
                t.id === tokenId ? { ...t, ...data } : t
              )
            }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    removeToken: (tokenId) => {
      set((s) => ({
        mapData: s.mapData
          ? { ...s.mapData, tokens: s.mapData.tokens.filter((t) => t.id !== tokenId) }
          : null,
        selectedTokenId: s.selectedTokenId === tokenId ? null : s.selectedTokenId,
        isDirty: true
      }))
      scheduleSave()
    },

    setSelectedToken: (id) => set({ selectedTokenId: id }),

    addNote: (note) => {
      const newNote: MapNote = { ...note, id: nanoid() }
      set((s) => ({
        mapData: s.mapData
          ? { ...s.mapData, notes: [...s.mapData.notes, newNote] }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    updateNote: (noteId, data) => {
      set((s) => ({
        mapData: s.mapData
          ? {
              ...s.mapData,
              notes: s.mapData.notes.map((n) =>
                n.id === noteId ? { ...n, ...data } : n
              )
            }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    removeNote: (noteId) => {
      set((s) => ({
        mapData: s.mapData
          ? { ...s.mapData, notes: s.mapData.notes.filter((n) => n.id !== noteId) }
          : null,
        isDirty: true
      }))
      scheduleSave()
    },

    clearMap: () => {
      if (saveTimer) clearTimeout(saveTimer)
      set({ mapData: null, activeMapId: null, selectedTokenId: null, isDirty: false, campaignId: null, scenarioId: null })
    }
  }
})

export const useSelectedToken = (): TokenInstance | null => {
  return useMapStore((s) => {
    if (!s.selectedTokenId || !s.mapData) return null
    return s.mapData.tokens.find((t) => t.id === s.selectedTokenId) ?? null
  })
}
