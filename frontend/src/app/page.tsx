'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardView from '@/components/dashboard/DashboardView'
import IndustrySelector from '@/components/factory/IndustrySelector'
import MachineConfigurator from '@/components/factory/MachineConfigurator'
import SimulationPanel from '@/components/simulation/SimulationPanel'
import TelemetryDashboard from '@/components/telemetry/TelemetryDashboard'
import DigitalTwinViewer from '@/components/twin/DigitalTwinViewer'
import AIAlertsDashboard from '@/components/ai/AIAlertsDashboard'
import SettingsPage from '@/components/settings/SettingsPage'
import StateSync from '@/components/StateSync'
import TelemetryUploader from '@/components/TelemetryUploader'

export type ViewType = 
  | 'dashboard' 
  | 'industry' 
  | 'machines' 
  | 'simulation' 
  | 'telemetry' 
  | 'twin' 
  | 'alerts'
  | 'settings'

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />
      case 'industry':
        return <IndustrySelector onNext={() => setCurrentView('machines')} />
      case 'machines':
        return <MachineConfigurator onNext={() => setCurrentView('simulation')} />
      case 'simulation':
        return <SimulationPanel />
      case 'telemetry':
        return <TelemetryDashboard />
      case 'twin':
        return <DigitalTwinViewer />
      case 'alerts':
        return <AIAlertsDashboard />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardView onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <StateSync />
      <TelemetryUploader />
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </main>
    </div>
  )
}
