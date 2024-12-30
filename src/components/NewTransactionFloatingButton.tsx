import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui'

interface NewTransactionFloatingButtonProps {
    walletId: string
}

export const NewTransactionFloatingButton = ({ walletId }: NewTransactionFloatingButtonProps) => {

    const href = walletId
        ? `/transacciones/nueva?walletId=${walletId}`
        : '/transacciones/nueva'

    return (
        <Button
            asChild
            className='fixed bottom-6 right-6 rounded-full p-0 w-14 h-14 md:w-16 md:h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white'
        >
            <Link href={href}>
                <Plus className='h-6 w-6 md:h-8 md:w-8 stroke-[3]' />
                <span className='sr-only'>Nueva Transacción</span>
            </Link>
        </Button>
    )
}
