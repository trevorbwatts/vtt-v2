import { useState } from 'react'
import type { Campaign } from './types'
import SplashScreen from './components/SplashScreen'
import MainLayout from './components/MainLayout'

export default function App() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  if (!campaign) {
    return <SplashScreen onSelectCampaign={setCampaign} />
  }

  return (
    <MainLayout
      campaign={campaign}
      onCampaignUpdate={setCampaign}
      onSwitchCampaign={() => setCampaign(null)}
    />
  )
}
