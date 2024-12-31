import { getCategories, getTransactions, getWallets } from '@/actions'
import { DashboardHome, NewTransactionFloatingButton } from '@/components'
import { format } from 'date-fns'


export default async function HomePage() {

    const transactions = await getTransactions()
    const categories = await getCategories()
    const wallets = await getWallets()

    console.log(Date.parse(format(new Date('2024-12-22T00:00:00'), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")))

    return (
        <>
            <DashboardHome transactions={ transactions } categories={ categories } wallets={ wallets } />

            <NewTransactionFloatingButton walletId='' />
        </>
    )
}

