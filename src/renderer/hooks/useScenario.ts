import { useState, useCallback, useEffect, useRef } from 'react'
import type { Token, MapNote, Combatant } from '../types'

interface ScenarioRow {
  id: string
  campaign_id: string
  name: string
  notes: string
  map_image_path: string | null
  sort_order: number
}

export function useScenario(campaignId: string | null) {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [mapNotes, setMapNotes] = useState<MapNote[]>([])
  const [activeCombatants, setActiveCombatants] = useState<Combatant[]>([])
  const [mapImageDataUrl, setMapImageDataUrl] = useState<string | null>(null)
  const [currentScenario, setCurrentScenario] = useState<ScenarioRow | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load scenarios when campaign changes
  useEffect(() => {
    if (!campaignId) {
      setScenarios([])
      setSelectedScenarioId(null)
      return
    }
    loadScenarios()
  }, [campaignId])

  // Load scenario data when selection changes
  useEffect(() => {
    if (!selectedScenarioId) {
      setTokens([])
      setMapNotes([])
      setActiveCombatants([])
      setMapImageDataUrl(null)
      setCurrentScenario(null)
      return
    }
    loadScenarioData(selectedScenarioId)
  }, [selectedScenarioId])

  const loadScenarios = useCallback(async () => {
    if (!campaignId) return
    const rows = await window.api.scenarios.list(campaignId) as ScenarioRow[]
    setScenarios(rows)
    if (rows.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(rows[0].id)
    }
  }, [campaignId, selectedScenarioId])

  const loadScenarioData = useCallback(async (scenarioId: string) => {
    const [tokenRows, noteRows, combatantRows, scenarioList] = await Promise.all([
      window.api.tokens.list(scenarioId),
      window.api.mapNotes.list(scenarioId),
      window.api.activeCombat.list(scenarioId),
      campaignId ? window.api.scenarios.list(campaignId) : Promise.resolve([])
    ])

    setTokens(tokenRows as Token[])
    setMapNotes(noteRows as MapNote[])
    setActiveCombatants(combatantRows as Combatant[])

    const scenario = (scenarioList as ScenarioRow[]).find(s => s.id === scenarioId) || null
    setCurrentScenario(scenario)

    if (scenario?.map_image_path) {
      const dataUrl = await window.api.maps.getImage(scenario.map_image_path)
      setMapImageDataUrl(dataUrl)
    } else {
      setMapImageDataUrl(null)
    }
  }, [campaignId])

  const createScenario = useCallback(async (name: string) => {
    if (!campaignId) return
    const row = await window.api.scenarios.create(campaignId, name) as ScenarioRow
    await loadScenarios()
    setSelectedScenarioId(row.id)
    return row
  }, [campaignId, loadScenarios])

  const deleteScenario = useCallback(async (id: string) => {
    await window.api.scenarios.delete(id)
    if (selectedScenarioId === id) {
      setSelectedScenarioId(null)
    }
    await loadScenarios()
  }, [selectedScenarioId, loadScenarios])

  const updateScenarioName = useCallback(async (name: string) => {
    if (!selectedScenarioId) return
    await window.api.scenarios.update(selectedScenarioId, { name })
    await loadScenarios()
    setCurrentScenario(prev => prev ? { ...prev, name } : null)
  }, [selectedScenarioId, loadScenarios])

  // ── Tokens ──

  const upsertToken = useCallback(async (data: Partial<Token>) => {
    if (!selectedScenarioId) return
    const result = await window.api.tokens.upsert(selectedScenarioId, data as Record<string, unknown>) as Token
    setTokens(prev => {
      const idx = prev.findIndex(t => t.id === result.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = result
        return next
      }
      return [...prev, result]
    })
    return result
  }, [selectedScenarioId])

  const deleteToken = useCallback(async (id: string) => {
    await window.api.tokens.delete(id)
    setTokens(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTokenPosition = useCallback((id: string, x: number, y: number) => {
    // Optimistic update
    setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))

    // Debounced save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      if (!selectedScenarioId) return
      await window.api.tokens.upsert(selectedScenarioId, { id, x, y })
    }, 100)
  }, [selectedScenarioId])

  const bulkUpsertTokens = useCallback(async (tokenData: Partial<Token>[]) => {
    if (!selectedScenarioId) return
    const result = await window.api.tokens.bulkUpsert(selectedScenarioId, tokenData as Record<string, unknown>[]) as Token[]
    setTokens(result)
    return result
  }, [selectedScenarioId])

  // ── Map Notes ──

  const upsertMapNote = useCallback(async (data: Partial<MapNote>) => {
    if (!selectedScenarioId) return
    const result = await window.api.mapNotes.upsert(selectedScenarioId, data as Record<string, unknown>) as MapNote
    setMapNotes(prev => {
      const idx = prev.findIndex(n => n.id === result.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = result
        return next
      }
      return [...prev, result]
    })
    return result
  }, [selectedScenarioId])

  const deleteMapNote = useCallback(async (id: string) => {
    await window.api.mapNotes.delete(id)
    setMapNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  // ── Active Combat ──

  const setActiveCombatantsList = useCallback(async (combatants: Combatant[]) => {
    if (!selectedScenarioId) return
    const result = await window.api.activeCombat.bulkSet(selectedScenarioId, combatants as unknown as Record<string, unknown>[]) as Combatant[]
    setActiveCombatants(result)
  }, [selectedScenarioId])

  const updateActiveCombatant = useCallback(async (data: Partial<Combatant> & { id: string }) => {
    if (!selectedScenarioId) return
    await window.api.activeCombat.upsert(selectedScenarioId, data as Record<string, unknown>)
    setActiveCombatants(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
  }, [selectedScenarioId])

  const removeActiveCombatant = useCallback(async (id: string) => {
    await window.api.activeCombat.delete(id)
    setActiveCombatants(prev => prev.filter(c => c.id !== id))
  }, [])

  const clearActiveCombat = useCallback(async () => {
    if (!selectedScenarioId) return
    await window.api.activeCombat.clear(selectedScenarioId)
    setActiveCombatants([])
  }, [selectedScenarioId])

  // ── Map Image ──

  const uploadMapImage = useCallback(async (file: File) => {
    if (!selectedScenarioId) return
    const buffer = await file.arrayBuffer()
    const relativePath = await window.api.maps.upload(selectedScenarioId, buffer, file.name)
    await window.api.scenarios.update(selectedScenarioId, { map_image_path: relativePath })
    const dataUrl = await window.api.maps.getImage(relativePath)
    setMapImageDataUrl(dataUrl)
    setCurrentScenario(prev => prev ? { ...prev, map_image_path: relativePath } : null)
  }, [selectedScenarioId])

  return {
    scenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    currentScenario,
    tokens,
    mapNotes,
    activeCombatants,
    mapImageDataUrl,
    loadScenarios,
    createScenario,
    deleteScenario,
    updateScenarioName,
    upsertToken,
    deleteToken,
    updateTokenPosition,
    bulkUpsertTokens,
    upsertMapNote,
    deleteMapNote,
    setActiveCombatantsList,
    updateActiveCombatant,
    removeActiveCombatant,
    clearActiveCombat,
    uploadMapImage,
    setTokens,
    setActiveCombatants
  }
}
