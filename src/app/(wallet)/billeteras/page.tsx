export const revalidate = 0


import { getCurrentCycleSummary, getWallets } from '@/actions'
import { DataUnavailableNotice, NewWallet, WalletCard, WalletsTotalBalance } from '@/components'

export default async function BilleterasPage() {

    const [respWallets, respCycleSummary] = await Promise.all([
        getWallets(),
        getCurrentCycleSummary(),
    ])

    const wallets = respWallets.ok && respWallets.wallets ? respWallets.wallets : []
    const cycleSummary = respCycleSummary.ok ? respCycleSummary.data : null
    const readIssue = [respWallets, respCycleSummary].find((response) => !response.ok)

    if ( !respWallets.ok ) {
        return (
            <div className='space-y-6'>
                <DataUnavailableNotice message={respWallets.message} />
                <div className='glass-panel rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center'>
                    <h2 className='text-xl font-semibold text-white'>Cuentas no disponibles</h2>
                    <p className='mt-2 text-sm text-slate-400'>
                        No pudimos cargar tus cuentas. Inténtalo de nuevo en unos segundos.
                    </p>
                </div>
            </div>
        )
    }

    const activeWallets = wallets.filter((wallet) => wallet.isActive)
    const parentWallets = activeWallets.filter((wallet) => !wallet.isSavingsBox)
    const savingsBoxTotalsByParent = new Map(
        parentWallets.map((wallet) => [
            wallet.id,
            activeWallets
                .filter((item) => item.isSavingsBox && item.parentWalletId === wallet.id)
                .reduce((sum, item) => sum + item.balance, 0),
        ])
    )

    return (
        <div className="space-y-6">
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Cuentas</p>
                <div className='mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <h1 className="text-2xl font-semibold text-white md:text-3xl">Billeteras</h1>
                </div>
            </div>

            {readIssue && <DataUnavailableNotice message={readIssue.message} />}

            <WalletsTotalBalance wallets={ wallets } cycleSummary={ cycleSummary } />

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {parentWallets.map(( wallet ) => (
                    <WalletCard
                        key={ wallet.id }
                        wallet={ wallet }
                        displayBalance={ wallet.balance + (savingsBoxTotalsByParent.get(wallet.id) ?? 0) }
                    />
                ))}

                <NewWallet />

            </div>
        </div>
    )
}

