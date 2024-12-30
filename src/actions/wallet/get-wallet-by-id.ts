'use server'

import { wallets } from '@/seed/data'

export const getWalletById = async ( walletId: string ) => wallets.find( w => w.id === walletId )