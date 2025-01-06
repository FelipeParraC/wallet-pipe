'use client'

import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui'

interface EditButtonProps {
    walletId: string
}

export const EditWalletButton = ({ walletId }: EditButtonProps) => {

    const router = useRouter()

    const onClick = ( id: string ) => {
        router.push(`/billeteras/editar/${ id }`)
        router.refresh()
    }

    return (
        <Button variant='outline' onClick={() => onClick( walletId )}>
            <Pencil className='mr-2 h-4 w-4' /> Editar
        </Button>
    )
}
