'use server'

import { isTransferTransaction } from '@/interfaces'
import { initialTransactions } from '@/seed/data'

export const getTransactionsByWalletId = async ( walletId: string ) => initialTransactions.filter(
    t => t.wallet === walletId || ( isTransferTransaction(t) && t.toWallet === walletId )
)