import { getCategories, getWalletById, getWallets } from '@/actions'
import { CreateTransactionForm } from '@/components'
import Link from 'next/link'

interface Props {
    searchParams: {
        walletId?: string
    }
}

export default async function NuevaTransaccionPage({ searchParams }: Props) {

    const walletId = searchParams.walletId || ''
    const respWallet = walletId ? await getWalletById( walletId ) : null
    const wallet = respWallet?.wallet

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

    if ( !wallets ) {
        return <></>
    }

    if (wallets.length === 0) {
        return (
            <div className='max-w-xl mx-auto rounded-lg border border-dashed p-8 text-center'>
                <h1 className='text-2xl font-bold'>Todavía no puedes registrar movimientos</h1>
                <p className='mt-3 text-sm text-muted-foreground'>
                    Primero crea una cuenta, una tarjeta de crédito o un saldo de transporte para que el movimiento tenga dónde impactar.
                </p>
                <Link href='/billeteras/nueva' className='mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'>
                    Crear cuenta
                </Link>
            </div>
        )
    }

    return (
        <div className='space-y-6 max-w-2xl mx-auto text-center'>
            <h1 className='text-3xl font-bold mb-8'>Nuevo Movimiento</h1>
            <p className='text-sm text-muted-foreground -mt-4 mb-2'>
                Registra movimientos reales con fecha y hora exactas. Para pagar una tarjeta, usa el tipo <span className='font-medium'>Pago de tarjeta</span>.
            </p>
            <CreateTransactionForm wallets={ wallets } categories={ categories } wallet={ wallet || undefined } />
        </div>
    )
}

