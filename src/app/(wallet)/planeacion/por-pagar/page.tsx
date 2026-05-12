export const revalidate = 0

import { getPlanningCycleOverview } from '@/actions'
import { PlanningUnavailable } from '@/components'
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
    <PlanningUnavailable message={overviewResponse.ok ? undefined : overviewResponse.message} />
  )
}
