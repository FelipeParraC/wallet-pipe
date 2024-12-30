'use server'

import { initialTransactions } from '@/seed/data'

export const getTransactionById = async (transactionId: string) => initialTransactions.find(transaction => transaction.id === transactionId) || null