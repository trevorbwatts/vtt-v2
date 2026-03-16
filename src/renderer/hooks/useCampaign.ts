import { useState, useEffect, useCallback } from 'react'
import type { Campaign, Combatant } from '../types'

interface CampaignRow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export function useCampaign() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [players, setPlayers] = useState<Combatant[]>([])
  const [npcs, setNpcs] = useState<Combatant[]>([])
  const [loading, setLoading] = useState(false)

  const loadCampaigns = useCallback(async () => {
    const rows = await window.api.campaigns.list()
    setCampaigns(rows as CampaignRow[])
  }, [])

  const createCampaign = useCallback(async (name: string) => {
    const row = await window.api.campaigns.create(name) as CampaignRow
    // Create initial scenario
    await window.api.scenarios.create(row.id, 'Initial Scenario')
    await loadCampaigns()
    return row
  }, [loadCampaigns])

  const selectCampaign = useCallback(async (id: string) => {
    setLoading(true)
    const campaigns = await window.api.campaigns.list() as CampaignRow[]
    const row = campaigns.find(c => c.id === id)
    if (!row) { setLoading(false); return }

    const combatants = await window.api.combatants.list(id) as Combatant[]
    const playerList = combatants.filter(c => c.type === 'player')
    const npcList = combatants.filter(c => c.type === 'npc')

    const scenarios = await window.api.scenarios.list(id)

    setCampaign({
      id: row.id,
      name: row.name,
      players: playerList,
      npcs: npcList,
      persistentEnemies: combatants.filter(c => c.type === 'enemy'),
      scenarios: scenarios as Campaign['scenarios']
    })
    setPlayers(playerList)
    setNpcs(npcList)
    setLoading(false)
  }, [])

  const updateCampaignName = useCallback(async (name: string) => {
    if (!campaign) return
    await window.api.campaigns.update(campaign.id, name)
    setCampaign(prev => prev ? { ...prev, name } : null)
  }, [campaign])

  const deleteCampaign = useCallback(async (id: string) => {
    await window.api.campaigns.delete(id)
    if (campaign?.id === id) setCampaign(null)
    await loadCampaigns()
  }, [campaign, loadCampaigns])

  const addCombatant = useCallback(async (data: Partial<Combatant>) => {
    if (!campaign) return null
    const result = await window.api.combatants.upsert(campaign.id, data as Record<string, unknown>) as Combatant
    // Refresh combatant lists
    const combatants = await window.api.combatants.list(campaign.id) as Combatant[]
    setPlayers(combatants.filter(c => c.type === 'player'))
    setNpcs(combatants.filter(c => c.type === 'npc'))
    setCampaign(prev => prev ? {
      ...prev,
      players: combatants.filter(c => c.type === 'player'),
      npcs: combatants.filter(c => c.type === 'npc'),
      persistentEnemies: combatants.filter(c => c.type === 'enemy')
    } : null)
    return result
  }, [campaign])

  const updateCombatant = useCallback(async (data: Partial<Combatant> & { id: string }) => {
    if (!campaign) return
    await window.api.combatants.upsert(campaign.id, data as Record<string, unknown>)
    const combatants = await window.api.combatants.list(campaign.id) as Combatant[]
    setPlayers(combatants.filter(c => c.type === 'player'))
    setNpcs(combatants.filter(c => c.type === 'npc'))
    setCampaign(prev => prev ? {
      ...prev,
      players: combatants.filter(c => c.type === 'player'),
      npcs: combatants.filter(c => c.type === 'npc'),
      persistentEnemies: combatants.filter(c => c.type === 'enemy')
    } : null)
  }, [campaign])

  const deleteCombatant = useCallback(async (id: string) => {
    if (!campaign) return
    await window.api.combatants.delete(id)
    const combatants = await window.api.combatants.list(campaign.id) as Combatant[]
    setPlayers(combatants.filter(c => c.type === 'player'))
    setNpcs(combatants.filter(c => c.type === 'npc'))
    setCampaign(prev => prev ? {
      ...prev,
      players: combatants.filter(c => c.type === 'player'),
      npcs: combatants.filter(c => c.type === 'npc'),
      persistentEnemies: combatants.filter(c => c.type === 'enemy')
    } : null)
  }, [campaign])

  return {
    campaigns,
    campaign,
    players,
    npcs,
    loading,
    loadCampaigns,
    createCampaign,
    selectCampaign,
    updateCampaignName,
    deleteCampaign,
    addCombatant,
    updateCombatant,
    deleteCombatant,
    setCampaign
  }
}
