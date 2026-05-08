export const revalidate = 0


import { getWallets } from '@/actions'
import { NewWallet, SavingsBoxForm, WalletCard, WalletsTotalBalance } from '@/components'

export default async function BilleterasPage() {

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    if ( !wallets ) {
        return <></>
    }

    const activeWallets = wallets.filter((wallet) => wallet.isActive)
    const parentWallets = activeWallets.filter((wallet) => !wallet.isSavingsBox)
    const savingsBoxesByParent = new Map(
        parentWallets.map((wallet) => [wallet.id, activeWallets.filter((item) => item.isSavingsBox && item.parentWalletId === wallet.id)])
    )

    return (
        <div className="space-y-6">
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Cuentas</p>
                <div className='mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <h1 className="text-2xl font-semibold text-white md:text-3xl">Billeteras</h1>
                    <SavingsBoxForm wallets={wallets} />
                </div>
            </div>

            <WalletsTotalBalance wallets={ wallets } />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {parentWallets.map(( wallet ) => (
                    <div key={ wallet.id } className='space-y-3'>
                        <WalletCard wallet={ wallet } />
                        {(savingsBoxesByParent.get(wallet.id) ?? []).map((box) => (
                            <div key={box.id} className='pl-4'>
                                <WalletCard wallet={ box } />
                            </div>
                        ))}
                    </div>
                ))}

                <NewWallet />

            </div>
        </div>
    )
}

