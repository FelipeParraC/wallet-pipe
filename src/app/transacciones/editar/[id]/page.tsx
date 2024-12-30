import { getTransactionById } from '@/actions'
import { EditTransactionForm } from '@/components'
import { Transaction } from '@/interfaces'

interface Props {
    params: {
        id: string
    }
}

export default async function EditarTransaccionPage({ params }: Props) {

    const transactionId = params.id
    const transaction = await getTransactionById(transactionId) as Transaction
    const type = transaction.type[0] + transaction.type.slice(1).toLowerCase()

    return (
        <div className='space-y-6 max-w-2xl mx-auto'>
            <h1 className='text-3xl font-bold text-center mb-8'>Editar { type }</h1>
            <EditTransactionForm transaction={ transaction } />
        </div>
    )
}