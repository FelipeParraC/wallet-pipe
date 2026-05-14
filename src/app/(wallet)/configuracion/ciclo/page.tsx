export const revalidate = 0

import { getCurrentCycleSummary, getCycleSettings } from '@/actions'
import { CycleSettingsForm, SettingsInfoCard, SettingsPageHeader } from '@/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default async function CicloSettingsPage() {
  const [cycleSettingsResponse, cycleSummaryResponse] = await Promise.all([
    getCycleSettings(),
    getCurrentCycleSummary(),
  ])

  const cycleSettings = cycleSettingsResponse.ok && cycleSettingsResponse.data ? cycleSettingsResponse.data.cycleSettings : null
  const currentCycle = cycleSummaryResponse.ok && cycleSummaryResponse.data ? cycleSummaryResponse.data.currentCycle : null

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Ciclo financiero' description='Define desde qué día Wallet Pipe calcula tu ciclo.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <CardTitle>Ciclo actual</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {currentCycle && <SettingsInfoCard label='Actual' value={`${currentCycle.label}${currentCycle.isManual ? ' · Manual' : ''}`} />}
          {cycleSettings && (
            <CycleSettingsForm
              defaultStartDay={cycleSettings.defaultStartDay}
              timezone={cycleSettings.timezone}
              currentCycle={currentCycle}
              periodOverrides={cycleSettings.periodOverrides ?? []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
