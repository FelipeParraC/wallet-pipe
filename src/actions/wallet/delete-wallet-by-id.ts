'use server'

import prisma from '@/lib/prisma'

export const deleteWalletById = async (id: string) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if (!userId) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    await prisma.$transaction(async (tx) => {

        // 1. Comprobar que la billetera exista
        const walletToDelete = await tx.wallet.findFirst({ where: { id } })

        if (!walletToDelete) {
            throw new Error(`No se encontró la billetera con el ID ${id}`)
        }

        // 2. Comprobar si había transferencias
        const transferTransaction = await tx.transaction.findFirst({ where: { OR: [{ fromWalletId: id }, { toWalletId: id }] } })

        // 3. Borrar transacciones de la billetera, excepto las transferencias
        await tx.transaction.deleteMany({
            where: {
                walletId: id,
                OR: [
                    { fromWalletId: { not: id } },
                    { fromWalletId: null }
                ]
            }
        })

        // 4.1. Eliminar la billetera si no hay transferencias
        if (!transferTransaction) {
            await tx.wallet.delete({ where: { id } })
            // 4.2. Desactivarla en caso de que haya transferencias
        } else {
            await tx.wallet.update({
                where: { id },
                data: {
                    balance: 0,
                    fareValue: walletToDelete.fareValue ? 0 : undefined,
                    includeInTotal: false,
                    isActive: false
                }
            })
        }

    })
}