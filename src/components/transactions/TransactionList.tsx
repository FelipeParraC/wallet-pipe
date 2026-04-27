import type { Category, Transaction } from "@/interfaces"
import { TransactionCard } from "./TransactionCard"

interface TransactionListProps {
    transactions: Transaction[]
    categories: Category[]
    onSelect: (transaction: Transaction) => void
}

export const TransactionList = ({ transactions, categories, onSelect }: TransactionListProps) => {

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {transactions.map((transaction) => transaction.isVisible && (
                <TransactionCard
                    key={ transaction.id }
                    transaction={ transaction }
                    categories={ categories }
                    onClick={() => onSelect( transaction )}
                />
            ))}
        </div>
    )
}

