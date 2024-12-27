"use client"

import { TransactionForm } from "@/components/transactions/TransactionForm"
import { useSearchParams, useRouter } from 'next/navigation'
import { Transaction } from "@/types/transaction"

export default function NuevaTransaccion() {
    const searchParams = useSearchParams()
    const defaultWallet = searchParams.get('wallet')
    const router = useRouter()

    const handleSubmit = (transaction: Transaction) => {
        // Aquí iría la lógica para guardar la nueva transacción
        console.log('Nueva transacción:', transaction)
        // Después de guardar, redirigimos a la página de transacciones
        router.push('/transacciones')
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Nueva Transacción</h1>
            <TransactionForm
                defaultWallet={defaultWallet || undefined}
                onSubmit={handleSubmit}
            />
        </div>
    )
}

