"use client"

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { TransactionDetailsModal } from "@/components/transactions/TransactionDetailsModal"
import { TransactionDatePicker } from "@/components/transactions/TransactionDatePicker"
import { TransactionList } from "@/components/transactions/TransactionList"
import { Transaction } from "@/types/transaction"
import { initialTransactions } from "@/seed/data"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const router = useRouter()

    const filteredTransactions = selectedDate
        ? transactions.filter(t => format(parseISO(t.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
        : transactions

    const handleEdit = (transaction: Transaction, e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/transacciones/editar/${transaction.id}`)
    }

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setTransactions(transactions.filter(t => t.id !== id))
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold md:text-3xl">Todas las Transacciones</h1>
                <Button asChild>
                    <Link href="/transacciones/nueva">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Transacción
                    </Link>
                </Button>
            </div>

            <div className="w-full max-w-sm">
                <TransactionDatePicker onDateSelect={setSelectedDate} />
            </div>

            {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground">No hay transacciones para la fecha seleccionada.</p>
            ) : (
                <TransactionList
                    transactions={filteredTransactions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSelect={setSelectedTransaction}
                />
            )}

            <TransactionDetailsModal
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />
        </div>
    )
}

