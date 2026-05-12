import { getCategories, getTags, getTransactions, getWalletById, getWallets } from '@/actions'
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
    const respTags = await getTags()
    const tags = respTags.ok && respTags.data ? respTags.data.tags : []
    const respTransactions = await getTransactions()
    const transactions = respTransactions.ok ? respTransactions.transactions : []

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
        <div className='mx-auto max-w-3xl space-y-6'>
            <section className='glass-panel rounded-[2rem] p-5 text-left sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Movimientos</p>
                <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>Nuevo movimiento</h1>
                <p className='mt-2 text-sm text-slate-400'>
                    Elige el tipo y solo verás los campos que aplican.
                </p>
            </section>
            <CreateTransactionForm wallets={ wallets } categories={ categories } tags={ tags } wallet={ wallet || undefined } transactions={ transactions ?? [] } />
        </div>
    )
}

