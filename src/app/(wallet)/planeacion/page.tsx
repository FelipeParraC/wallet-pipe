export const revalidate = 0

import { getPlanningCycleOverview } from '@/actions'
import { PlanningWorkbench } from '@/components/planning/PlanningWorkbench'

interface PlaneacionPageProps {
    searchParams?: {
        cycle?: string
    }
}

export default async function PlaneacionPage({ searchParams }: PlaneacionPageProps) {
    const overviewResponse = await getPlanningCycleOverview(searchParams?.cycle)
    const overview = overviewResponse.ok && overviewResponse.data ? overviewResponse.data : null

    return (
        overview ? (
            <PlanningWorkbench
                currentCycle={overview.currentCycle}
                wallets={overview.wallets}
                categories={overview.categories}
                scheduledOccurrences={overview.scheduledOccurrences}
                installmentOccurrences={overview.installmentOccurrences}
                scheduledPlans={overview.scheduledPlans}
                installmentPlans={overview.installmentPlans}
                debts={overview.debts}
                summary={overview.summary}
            />
        ) : (
            <div className='glass-panel rounded-[1.75rem] p-8 text-center text-sm text-slate-400'>
                No se pudo cargar Planeación.
            </div>
        )
    )
}
