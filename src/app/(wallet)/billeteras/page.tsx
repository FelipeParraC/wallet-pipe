export const revalidate = 0


import { getCurrentCycleSummary, getWallets } from '@/actions'
import { NewWallet, WalletCard, WalletsTotalBalance } from '@/components'

export default async function BilleterasPage() {

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []
    const respCycleSummary = await getCurrentCycleSummary()
    const cycleSummary = respCycleSummary.ok ? respCycleSummary.data : null

    if ( !wallets ) {
        return <></>
    }

    const activeWallets = wallets.filter((wallet) => wallet.isActive)
    const parentWallets = activeWallets.filter((wallet) => !wallet.isSavingsBox)

    return (
        <div className="space-y-6">
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Cuentas</p>
                <div className='mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <h1 className="text-2xl font-semibold text-white md:text-3xl">Billeteras</h1>
                </div>
            </div>

            <WalletsTotalBalance wallets={ wallets } cycleSummary={ cycleSummary } />

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {parentWallets.map(( wallet ) => (
                    <WalletCard key={ wallet.id } wallet={ wallet } />
                ))}

                <NewWallet />

            </div>
        </div>
    )
}

