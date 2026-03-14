import { create } from 'zustand'

export type ActiveView = 'campaign' | 'map'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  /** Map-space coordinates of the right-click */
  mapX: number
  mapY: number
  targetTokenId: string | null
}

interface UIStore {
  activeView: ActiveView
  bestiaryOpen: boolean
  addPlayersOpen: boolean
  noteEditorOpen: boolean
  editingNoteId: string | null
  /** Position to place note when using "Add Note" context menu */
  pendingNotePosition: { x: number; y: number } | null
  contextMenu: ContextMenuState

  setActiveView: (view: ActiveView) => void
  openBestiary: () => void
  closeBestiary: () => void
  openAddPlayers: () => void
  closeAddPlayers: () => void
  openNoteEditor: (noteId?: string, position?: { x: number; y: number }) => void
  closeNoteEditor: () => void
  showContextMenu: (
    screenX: number,
    screenY: number,
    mapX: number,
    mapY: number,
    tokenId?: string
  ) => void
  hideContextMenu: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: 'campaign',
  bestiaryOpen: false,
  addPlayersOpen: false,
  noteEditorOpen: false,
  editingNoteId: null,
  pendingNotePosition: null,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    mapX: 0,
    mapY: 0,
    targetTokenId: null
  },

  setActiveView: (view) => set({ activeView: view }),

  openBestiary: () => set({ bestiaryOpen: true }),
  closeBestiary: () => set({ bestiaryOpen: false }),

  openAddPlayers: () => set({ addPlayersOpen: true }),
  closeAddPlayers: () => set({ addPlayersOpen: false }),

  openNoteEditor: (noteId, position) =>
    set({
      noteEditorOpen: true,
      editingNoteId: noteId ?? null,
      pendingNotePosition: position ?? null
    }),
  closeNoteEditor: () =>
    set({ noteEditorOpen: false, editingNoteId: null, pendingNotePosition: null }),

  showContextMenu: (screenX, screenY, mapX, mapY, tokenId) =>
    set({
      contextMenu: {
        visible: true,
        x: screenX,
        y: screenY,
        mapX,
        mapY,
        targetTokenId: tokenId ?? null
      }
    }),

  hideContextMenu: () =>
    set((s) => ({
      contextMenu: { ...s.contextMenu, visible: false, targetTokenId: null }
    }))
}))
