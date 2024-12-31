import { getCategories, getTransactions, getWallets } from '@/actions'
import { DashboardHome, NewTransactionFloatingButton } from '@/components'


export default async function HomePage() {

    const transactions = await getTransactions()
    const categories = await getCategories()
    const wallets = await getWallets()

    return (
        <>
            <DashboardHome transactions={ transactions } categories={ categories } wallets={ wallets } />

            <NewTransactionFloatingButton walletId='' />
        </>
    )
}

