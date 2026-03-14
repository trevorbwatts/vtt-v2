import { create } from 'zustand'
import type { Campaign, PlayerCharacter } from '../types/campaign.types'

interface CampaignStore {
  campaigns: Campaign[]
  activeCampaignId: string | null
  loading: boolean
  error: string | null

  loadCampaigns: () => Promise<void>
  createCampaign: (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Campaign>
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  setActiveCampaign: (id: string | null) => void

  // Player characters
  addPlayerCharacter: (campaignId: string, pc: Omit<PlayerCharacter, 'id'>) => Promise<void>
  updatePlayerCharacter: (campaignId: string, pcId: string, data: Partial<PlayerCharacter>) => Promise<void>
  deletePlayerCharacter: (campaignId: string, pcId: string) => Promise<void>
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  activeCampaignId: null,
  loading: false,
  error: null,

  loadCampaigns: async () => {
    set({ loading: true, error: null })
    try {
      const campaigns = await window.api.campaign.list()
      set({ campaigns, loading: false })
    } catch (err) {
      set({ error: String(err), loading: false })
    }
  },

  createCampaign: async (data) => {
    const campaign = await window.api.campaign.create(data)
    set((s) => ({ campaigns: [...s.campaigns, campaign] }))
    return campaign
  },

  updateCampaign: async (id, data) => {
    const updated = await window.api.campaign.update(id, data)
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? updated : c))
    }))
  },

  deleteCampaign: async (id) => {
    await window.api.campaign.delete(id)
    set((s) => ({
      campaigns: s.campaigns.filter((c) => c.id !== id),
      activeCampaignId: s.activeCampaignId === id ? null : s.activeCampaignId
    }))
  },

  setActiveCampaign: (id) => {
    set({ activeCampaignId: id })
  },

  addPlayerCharacter: async (campaignId, pc) => {
    const newPc = await window.api.campaign.addPlayerCharacter(campaignId, pc)
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === campaignId
          ? { ...c, playerCharacters: [...c.playerCharacters, newPc] }
          : c
      )
    }))
  },

  updatePlayerCharacter: async (campaignId, pcId, data) => {
    await window.api.campaign.updatePlayerCharacter(campaignId, pcId, data)
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              playerCharacters: c.playerCharacters.map((pc) =>
                pc.id === pcId ? { ...pc, ...data } : pc
              )
            }
          : c
      )
    }))
  },

  deletePlayerCharacter: async (campaignId, pcId) => {
    await window.api.campaign.deletePlayerCharacter(campaignId, pcId)
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === campaignId
          ? { ...c, playerCharacters: c.playerCharacters.filter((pc) => pc.id !== pcId) }
          : c
      )
    }))
  }
}))

export const useActiveCampaign = (): Campaign | null => {
  return useCampaignStore((s) =>
    s.campaigns.find((c) => c.id === s.activeCampaignId) ?? null
  )
}
