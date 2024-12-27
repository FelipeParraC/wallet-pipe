import { Transaction } from "@/types/transaction"
import { TransactionCard } from "@/components/transactions/TransactionCard"

interface TransactionListProps {
    transactions: Transaction[]
    onEdit: (transaction: Transaction, e: React.MouseEvent) => void
    onDelete: (id: number, e: React.MouseEvent) => void
    onSelect: (transaction: Transaction) => void
}

export function TransactionList({ transactions, onEdit, onDelete, onSelect }: TransactionListProps) {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {transactions.map((transaction) => (
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

