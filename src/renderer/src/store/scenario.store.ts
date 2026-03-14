import { create } from 'zustand'
import type { Scenario } from '../types/map.types'

interface ScenarioStore {
  scenarios: Scenario[]
  activeScenarioId: string | null
  loading: boolean

  loadScenarios: (campaignId: string) => Promise<void>
  createScenario: (data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Scenario>
  updateScenario: (campaignId: string, scenarioId: string, data: Partial<Scenario>) => Promise<void>
  deleteScenario: (campaignId: string, scenarioId: string) => Promise<void>
  setActiveScenario: (id: string | null) => void
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: [],
  activeScenarioId: null,
  loading: false,

  loadScenarios: async (campaignId) => {
    set({ loading: true })
    try {
      const scenarios = await window.api.scenario.list(campaignId)
      set({ scenarios, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createScenario: async (data) => {
    const scenario = await window.api.scenario.create(data)
    set((s) => ({ scenarios: [...s.scenarios, scenario] }))
    return scenario
  },

  updateScenario: async (campaignId, scenarioId, data) => {
    const updated = await window.api.scenario.update(campaignId, scenarioId, data)
    set((s) => ({
      scenarios: s.scenarios.map((sc) => (sc.id === scenarioId ? updated : sc))
    }))
  },

  deleteScenario: async (campaignId, scenarioId) => {
    await window.api.scenario.delete(campaignId, scenarioId)
    set((s) => ({
      scenarios: s.scenarios.filter((sc) => sc.id !== scenarioId),
      activeScenarioId: s.activeScenarioId === scenarioId ? null : s.activeScenarioId
    }))
  },

  setActiveScenario: (id) => set({ activeScenarioId: id })
}))

export const useActiveScenario = (): Scenario | null => {
  return useScenarioStore((s) =>
    s.scenarios.find((sc) => sc.id === s.activeScenarioId) ?? null
  )
}
