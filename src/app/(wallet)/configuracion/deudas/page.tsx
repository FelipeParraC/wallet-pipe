export const revalidate = 0

import Link from 'next/link'
import { getSettingsOverview } from '@/actions'
import { SettingsInfoCard, SettingsPageHeader } from '@/components'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/utils'

export default async function DeudasSettingsPage() {
  const overviewResponse = await getSettingsOverview()
  const debts = overviewResponse.ok && overviewResponse.data ? overviewResponse.data.debts : []
  const activeDebts = debts.filter((debt) => debt.status === 'ACTIVA')
  const iOwe = activeDebts.filter((debt) => debt.direction === 'YO_DEBO').reduce((sum, debt) => sum + debt.currentBalance, 0)
  const theyOweMe = activeDebts.filter((debt) => debt.direction === 'ME_DEBEN').reduce((sum, debt) => sum + debt.currentBalance, 0)

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Deudas' description='Resumen de deudas activas. La operación vive en Planeación.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SettingsInfoCard label='Debo' value={formatCurrency(iOwe)} />
          <SettingsInfoCard label='Me deben' value={formatCurrency(theyOweMe)} />
          <div className='grid gap-3'>
            {activeDebts.map((debt) => (
              <div key={debt.id} className='rounded-2xl border border-white/10 bg-white/[0.04] p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold text-white'>{debt.title}</p>
                    <p className='mt-1 text-xs text-slate-500'>{debt.personName}</p>
                  </div>
                  <p className='shrink-0 font-semibold text-sky-100'>{formatCurrency(debt.currentBalance)}</p>
                </div>
              </div>
            ))}
          </div>
          <Button asChild>
            <Link href='/planeacion'>Revisar deudas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
