import type { Transaction } from "@/interfaces"
import { TransactionCard } from "./TransactionCard"

interface TransactionListProps {
    transactions: Transaction[]
    onSelect: (transaction: Transaction) => void
}

export const TransactionList = ({ transactions, onSelect }: TransactionListProps) => {

    const onEdit = (transaction: Transaction, e: React.MouseEvent) => {
        console.log({ transaction, e })
        //TODO: Ya veremosc qué se hace
    }

    const onDelete = (id: string, e: React.MouseEvent) => {
        console.log({ id, e })
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

