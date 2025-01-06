'use server'

import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { mapToWallet } from '@/utils'


export const getWalletById = async ( id: string ) => {

    const session = await auth()
        
    if ( !session ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario',
            wallet: null
        }
    }

    try {
        
        const prismaWallet = await prisma.wallet.findFirst({ where: { id: id } })

        if ( !prismaWallet ) return { ok: false, message: `No se encontró la billetera con ID ${ id }`, wallet: null }

        if ( prismaWallet.userId !== session.user.id ) return { ok: false, message: 'El usuario no es propietario de la billetera', wallet: null }

        const wallet = mapToWallet( prismaWallet )

        return { ok: true, message: '', wallet }

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener la wallet por id')
    }

}