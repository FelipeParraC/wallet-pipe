export const revalidate = 0

import Link from 'next/link'
import { getSettingsOverview } from '@/actions'
import { SettingsInfoCard, SettingsPageHeader } from '@/components'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency, getWalletTypeLabel } from '@/utils'

export default async function CuentasSettingsPage() {
  const overviewResponse = await getSettingsOverview()
  const wallets = overviewResponse.ok && overviewResponse.data ? overviewResponse.data.wallets : []
  const accounts = wallets.filter((wallet) => wallet.isActive && !wallet.isSavingsBox && wallet.type !== 'Tarjeta de Crédito')
  const total = accounts.reduce((sum, wallet) => sum + wallet.balance, 0)

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Cuentas' description='Resumen de cuentas reales. La edición vive en Cuentas.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SettingsInfoCard label='Total en cuentas' value={formatCurrency(total)} />
          <SettingsInfoCard label='Cuentas activas' value={`${accounts.length}`} />
          <div className='grid gap-3'>
            {accounts.map((wallet) => (
              <Link key={wallet.id} href={`/billeteras/${wallet.id}`} className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold text-white'>{wallet.name}</p>
                    <p className='mt-1 text-xs text-slate-500'>{getWalletTypeLabel(wallet.type)}</p>
                  </div>
                  <p className='shrink-0 font-semibold text-sky-100'>{formatCurrency(wallet.balance)}</p>
                </div>
              </Link>
            ))}
          </div>
          <Button asChild>
            <Link href='/billeteras'>Ver cuentas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
