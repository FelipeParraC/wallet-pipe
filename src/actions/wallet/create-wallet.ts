'use server'

import type { CreateWalletInput } from '@/interfaces'

export const createWallet = async (data: CreateWalletInput) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if ( !userId ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    console.log({ data })

}
