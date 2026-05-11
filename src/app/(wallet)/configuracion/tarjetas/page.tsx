export const revalidate = 0

import Link from 'next/link'
import { getSettingsOverview } from '@/actions'
import { SettingsInfoCard, SettingsPageHeader } from '@/components'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/utils'

export default async function TarjetasSettingsPage() {
  const overviewResponse = await getSettingsOverview()
  const wallets = overviewResponse.ok && overviewResponse.data ? overviewResponse.data.wallets : []
  const cards = wallets.filter((wallet) => wallet.isActive && wallet.type === 'Tarjeta de Crédito')
  const totalDebt = cards.reduce((sum, card) => sum + Math.max(card.balance, 0), 0)
  const totalCredit = cards.reduce((sum, card) => sum + (card.availableCredit ?? 0), 0)

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Tarjetas' description='Resumen de tarjetas. La gestión detallada vive en cada cuenta.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SettingsInfoCard label='Deuda actual' value={formatCurrency(totalDebt)} />
          <SettingsInfoCard label='Cupo disponible' value={formatCurrency(totalCredit)} />
          <div className='grid gap-3'>
            {cards.map((card) => (
              <Link key={card.id} href={`/billeteras/${card.id}`} className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold text-white'>{card.name}</p>
                    <p className='mt-1 text-xs text-slate-500'>Corte {card.statementClosingDay ?? '-'} · Pago {card.paymentDueDay ?? '-'}</p>
                  </div>
                  <p className='shrink-0 font-semibold text-red-200'>{formatCurrency(card.balance)}</p>
                </div>
              </Link>
            ))}
          </div>
          <Button asChild>
            <Link href='/billeteras'>Ver tarjetas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
