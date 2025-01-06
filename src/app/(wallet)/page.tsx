export const revalidate = 0

import { getCategories, getTransactions, getWallets } from '@/actions'
import { auth } from '@/auth.config'
import { DashboardHome, NewTransactionFloatingButton } from '@/components'


export default async function HomePage() {

    const session = await auth()

    const respTransactions = await getTransactions()
    const transactions = respTransactions.ok ? respTransactions.transactions : []

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

    return (
        <div className='space-y-9'>
            <h1 className='text-2xl font-bold md:text-3xl text-center'>
                {session ? `Hola, ${ session.user.name }` : 'Bienvenido a Wallet Pipe'}
            </h1>

            <DashboardHome transactions={ transactions } categories={ categories } wallets={ wallets } />

            <NewTransactionFloatingButton walletId='' />
        </div>
    )
}

