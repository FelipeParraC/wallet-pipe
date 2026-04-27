export const revalidate = 0


import { getWallets } from '@/actions'
import { NewWallet, WalletCard, WalletsTotalBalance } from '@/components'

export default async function BilleterasPage() {

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    if ( !wallets ) {
        return <></>
    }

    return (
        <div className="space-y-6">
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Cuentas</p>
                <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Billeteras</h1>
            </div>

            <WalletsTotalBalance wallets={ wallets } />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {wallets.map(( wallet ) => wallet.isActive && (
                    <WalletCard wallet={ wallet } key={ wallet.id } />
                ))}

                <NewWallet />

            </div>
        </div>
    )
}

