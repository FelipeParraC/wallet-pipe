import { getTransactions, getWallets } from '@/actions'
import { DashboardHome, NewTransactionFloatingButton } from '@/components'


export default async function HomePage() {

    const transactions = await getTransactions()
    const wallets = await getWallets()

    return (
        <>
            <DashboardHome transactions={ transactions } wallets={ wallets } />

            <NewTransactionFloatingButton walletId='' />
        </>
    )
}

