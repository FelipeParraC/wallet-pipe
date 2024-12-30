import { CreateTransactionForm } from '@/components'

export default function NuevaTransaccionPage() {

    return (
        <div className='space-y-6 max-w-2xl mx-auto text-center'>
            <h1 className='text-3xl font-bold mb-8'>Nueva Transacción</h1>
            <CreateTransactionForm />
        </div>
    )
}

