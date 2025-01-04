import { Transaction } from '@/interfaces'
import { create } from 'zustand'



interface TransactionState {
    transactions: Transaction[]

    setTransactions: (transactions: Transaction[]) => void
    addTransaction: (transaction: Transaction) => void
    updateTransaction: (transaction: Transaction) => void
    removeTransaction: (id: string) => void
}

export const useTransactionStore = create<TransactionState>((set) => ({

    transactions: [],

    setTransactions: (transactions) => set({ transactions }),
    addTransaction: (transaction) =>
        set((state) => ({ transactions: [...state.transactions, transaction] })),
    updateTransaction: (transaction) =>
        set((state) => ({
            transactions: state.transactions.map((t) =>
                t.id === transaction.id ? transaction : t
            ),
        })),
    removeTransaction: (id) =>
        set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
        })),
}))