export const revalidate = 0


import { getWallets } from '@/actions'
import { NewWallet, WalletCard, WalletsTotalBalance } from '@/components'

export default async function BilleterasPage() {

    const wallets = await getWallets()

    if ( !wallets ) {
        return <></>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold md:text-3xl">Mis Billeteras</h1>

            <WalletsTotalBalance wallets={ wallets } />

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map(( wallet ) => wallet.isActive && (
                    <WalletCard wallet={ wallet } key={ wallet.id } />
                ))}

                <NewWallet />

            </div>
        </div>
    )
}

