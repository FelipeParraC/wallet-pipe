export const revalidate = 0

import { getPlanningCycleOverview } from '@/actions'
import { PlanningWorkbench } from '@/components/planning/PlanningWorkbench'

interface PlaneacionSectionPageProps {
  searchParams?: {
    cycle?: string
  }
}

export default async function PlaneacionPorPagarPage({ searchParams }: PlaneacionSectionPageProps) {
  const overviewResponse = await getPlanningCycleOverview(searchParams?.cycle)
  const overview = overviewResponse.ok && overviewResponse.data ? overviewResponse.data : null

  return overview ? (
    <PlanningWorkbench
      mode='section'
      initialTab='pendientes'
      currentCycle={overview.currentCycle}
      wallets={overview.wallets}
      categories={overview.categories}
      scheduledOccurrences={overview.scheduledOccurrences}
      installmentOccurrences={overview.installmentOccurrences}
      creditCardObligations={overview.creditCardObligations}
      cardPaymentsInCycle={overview.cardPaymentsInCycle}
      scheduledPlans={overview.scheduledPlans}
      installmentPlans={overview.installmentPlans}
      debts={overview.debts}
      summary={overview.summary}
    />
  ) : (
    <div className='glass-panel rounded-[1.75rem] p-8 text-center text-sm text-slate-400'>No se pudo cargar Planeación.</div>
  )
}
