export const revalidate = 0


import { getCategories, getTags, getTransactionById } from '@/actions'
import { EditTransactionForm } from '@/components'
import type { Transaction } from '@/interfaces'
import { getTransactionTypeLabel } from '@/utils'
import { redirect } from 'next/navigation'

interface Props {
    params: {
        id: string
    }
    searchParams: {
        walletId: string
    }
}

export default async function EditarTransaccionPage({ params, searchParams }: Props) {

    const transactionId = params.id
    const respTransaction = await getTransactionById( transactionId )

    if ( !respTransaction.ok ) {
        redirect('/movimientos')
    }
        
    const transaction = respTransaction.ok ? respTransaction.transaction : {} as Transaction
    
    if ( !transaction ) {
        redirect('/movimientos')
    }

    const walletId = searchParams.walletId

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []
    const respTags = await getTags()
    const tags = respTags.ok && respTags.data ? respTags.data.tags : []

    return (
        <div className='mx-auto max-w-2xl space-y-6'>
            <section className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Movimientos</p>
                <h1 className='mt-2 text-2xl font-semibold text-white md:text-3xl'>Editar { getTransactionTypeLabel(transaction.type) }</h1>
                <p className='mt-2 text-sm text-slate-400'>
                    Corrige datos del movimiento sin perder la trazabilidad contable.
                </p>
            </section>
            <EditTransactionForm transaction={ transaction } categories={ categories } tags={ tags } walletId={ walletId } />
        </div>
    )
}
