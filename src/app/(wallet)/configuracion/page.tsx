export const revalidate = 0

import { getCurrentCycleSummary, getCycleSettings, getSettingsOverview } from '@/actions'
import { auth } from '@/auth.config'
import { CycleSettingsForm, TaxonomyManager } from '@/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default async function ConfiguracionPage() {
    const session = await auth()
    const [cycleSettingsResponse, cycleSummaryResponse, settingsOverviewResponse] = await Promise.all([
        getCycleSettings(),
        getCurrentCycleSummary(),
        getSettingsOverview(),
    ])

    const cycleSettings = cycleSettingsResponse.ok && cycleSettingsResponse.data ? cycleSettingsResponse.data.cycleSettings : null
    const currentCycle = cycleSummaryResponse.ok && cycleSummaryResponse.data ? cycleSummaryResponse.data.currentCycle : null
    const settingsOverview = settingsOverviewResponse.ok && settingsOverviewResponse.data ? settingsOverviewResponse.data : null
    const categories = settingsOverview?.categories ?? []
    const tags = settingsOverview?.tags ?? []

    return (
        <div className='space-y-6'>
            <section className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Ajustes</p>
                <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>Configuración</h1>
            </section>

            <div className='grid gap-4 xl:grid-cols-[0.9fr_1.1fr]'>
                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className='grid gap-3 text-sm'>
                        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                            <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Nombre</p>
                            <p className='mt-2 font-medium text-white'>{session?.user.name}</p>
                        </div>
                        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                            <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Apodo</p>
                            <p className='mt-2 font-medium text-white'>{session?.user.nickname}</p>
                        </div>
                        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                            <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Correo</p>
                            <p className='mt-2 font-medium text-white'>{session?.user.email}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className='rounded-[1.75rem]'>
                    <CardHeader>
                        <CardTitle>Ciclo</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {currentCycle && (
                            <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                                <p className='text-xs uppercase tracking-[0.22em] text-slate-500'>Actual</p>
                                <p className='mt-2 font-medium text-white'>{currentCycle.label}</p>
                            </div>
                        )}
                        {cycleSettings && (
                            <CycleSettingsForm
                                defaultStartDay={cycleSettings.defaultStartDay}
                                timezone={cycleSettings.timezone}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            <TaxonomyManager categories={categories} tags={tags} />
        </div>
    )
}
