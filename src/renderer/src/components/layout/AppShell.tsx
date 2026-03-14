import React from 'react'
import { useUIStore } from '../../store/ui.store'
import { useMapStore } from '../../store/map.store'
import { Sidebar } from './Sidebar'
import { CampaignPage } from '../../pages/CampaignPage'
import { MapPage } from '../../pages/MapPage'

export function AppShell(): React.ReactElement {
  const activeView = useUIStore((s) => s.activeView)
  const { mapData, isDirty } = useMapStore()

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 h-10 flex-shrink-0 text-xs"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-muted)'
          }}
        >
          <span>
            {activeView === 'map' && mapData
              ? `Map: ${mapData.name}`
              : 'Campaign Manager'}
          </span>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span style={{ color: 'var(--warning)' }}>● Unsaved changes</span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>VTT v0.1.0</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'campaign' && <CampaignPage />}
          {activeView === 'map' && <MapPage />}
        </div>
      </main>
    </div>
  )
}
