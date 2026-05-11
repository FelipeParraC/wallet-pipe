export const revalidate = 0

import Link from 'next/link'
import { getSettingsOverview } from '@/actions'
import { SettingsInfoCard, SettingsPageHeader } from '@/components'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency, getRecurrenceFrequencyLabel, getScheduledPlanKindLabel } from '@/utils'

export default async function PlaneacionSettingsPage() {
  const overviewResponse = await getSettingsOverview()
  const overview = overviewResponse.ok && overviewResponse.data ? overviewResponse.data : null
  const scheduledPlans = overview?.scheduledPlans ?? []
  const installmentPlans = overview?.installmentPlans ?? []
  const activeScheduled = scheduledPlans.filter((plan) => plan.isActive)
  const activeInstallments = installmentPlans.filter((plan) => plan.isActive)
  const installmentDebt = activeInstallments.reduce((sum, plan) => sum + (plan.installmentAmount * plan.remainingInstallments), 0)

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Planeación' description='Resumen de obligaciones configuradas. La operación vive en Planeación.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SettingsInfoCard label='Pagos activos' value={`${activeScheduled.length}`} />
          <SettingsInfoCard label='Cuotas activas' value={`${activeInstallments.length}`} />
          <SettingsInfoCard label='Saldo pendiente en cuotas' value={formatCurrency(installmentDebt)} />
          <div className='grid gap-3'>
            {activeScheduled.slice(0, 4).map((plan) => (
              <div key={plan.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                <p className='font-semibold text-white'>{plan.title}</p>
                <p className='mt-1 text-xs text-slate-500'>{getScheduledPlanKindLabel(plan.kind)} · {getRecurrenceFrequencyLabel(plan.frequency)}</p>
              </div>
            ))}
          </div>
          <Button asChild>
            <Link href='/planeacion'>Ir a planeación</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
