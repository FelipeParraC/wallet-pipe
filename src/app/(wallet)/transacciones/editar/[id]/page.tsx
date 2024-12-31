import { getCategories, getTransactionById } from '@/actions'
import { EditTransactionForm } from '@/components'
import type { Transaction } from '@/interfaces'

interface Props {
    params: {
        id: string
    }
    searchParams: {
        walletId: string
    }
}

export default async function EditarTransaccionPage({ params, searchParams }: Props) {

    const transactionId = params.id
    const transaction = await getTransactionById(transactionId) as Transaction
    const walletId = searchParams.walletId
    const type = transaction.type[0] + transaction.type.slice(1).toLowerCase()
    const categories = await getCategories()

    return (
        <div className='space-y-6 max-w-2xl mx-auto'>
            <h1 className='text-3xl font-bold text-center mb-8'>Editar { type }</h1>
            <EditTransactionForm transaction={ transaction } categories={ categories } walletId={ walletId } />
        </div>
    )
}