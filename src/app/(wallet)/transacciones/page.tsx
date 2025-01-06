export const revalidate = 0

import { NewTransactionFloatingButton, TransactionsGrid } from '@/components'
import { getCategories, getTransactions } from '@/actions'

export default async function TransaccionesPage() {

    const respTransactions = await getTransactions()
    const transactions = respTransactions.ok ? respTransactions.transactions : []

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

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

