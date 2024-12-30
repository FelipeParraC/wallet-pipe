'use client'

import { TransactionCard } from "@/components/transactions/TransactionCard"
import { Transaction } from "@/interfaces"
import { useRouter } from "next/navigation"

interface TransactionListProps {
    transactions: Transaction[]
    onSelect: (transaction: Transaction) => void
}

export function TransactionList({ transactions, onSelect }: TransactionListProps) {

    const router = useRouter()


    const onEdit = (transaction: Transaction, e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/transacciones/editar/${transaction.id}`)
    }

    const onDelete = (id: string, e: React.MouseEvent) => {
        console.log({id, e})
        //TODO: Ya veremosc qué se hace
    }
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {transactions.map((transaction) => transaction.isVisible && (
                <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClick={() => onSelect(transaction)}
                />
            ))}
        </div>
    )
}

