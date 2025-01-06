'use server'

import type { CreateWalletInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { mapToCreatePrismaWallet, mapToPrismaTransactionType } from '@/utils'

export const createWallet = async (data: CreateWalletInput) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if ( !userId ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    await prisma.$transaction( async(tx) => {

        // 1. Crear la billetera

        const wallet = mapToCreatePrismaWallet( data, userId )

        const prismaWallet = await tx.wallet.create({
            data: wallet
        })
        
        await tx.transaction.create({
            data: {
                userId,
                title: '',
                description: '',
                type: mapToPrismaTransactionType('INGRESO'),
                walletId: prismaWallet.id,
                date: Number( prismaWallet.createdAt ),
                categoryId: '10',
                amount: data.balance,
                isVisible: false,
            }
        })

        return {
            ok: true,
            wallet
        }
    })

}
