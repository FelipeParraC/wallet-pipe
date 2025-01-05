export const revalidate = 0

import { NewTransactionFloatingButton, TransactionsGrid } from '@/components'
import { getCategories, getTransactions } from '@/actions'

export default async function TransaccionesPage() {

    const transactions = await getTransactions()
    const categories = await getCategories()

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h1 className='text-2xl font-bold md:text-3xl'>Todas las Transacciones</h1>
            </div>

            <TransactionsGrid transactions={ transactions } categories={ categories } />

            <NewTransactionFloatingButton walletId='' />
        </div>
    )
}

