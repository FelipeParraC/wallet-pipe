"use client"

import { TransactionForm } from "@/components/TransactionForm"
import { useSearchParams } from 'next/navigation'

export default function NuevaTransaccion() {
    const searchParams = useSearchParams()
    const defaultWallet = searchParams.get('wallet')

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Nueva Transacción</h1>
            <TransactionForm defaultWallet={defaultWallet || undefined} />
        </div>
    )
}

