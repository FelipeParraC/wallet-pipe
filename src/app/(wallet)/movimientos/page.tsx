export const revalidate = 0

import Link from 'next/link'
import { DataUnavailableNotice, NewTransactionFloatingButton, TransactionsGrid } from '@/components'
import { getCategories, getCurrentCycleSummary, getTransactions, getWallets } from '@/actions'

export default async function MovimientosPage() {
    const [walletsResponse, respTransactions, respCategories, respSummary] = await Promise.all([
        getWallets(),
        getTransactions(),
        getCategories(),
        getCurrentCycleSummary(),
    ])

    const wallets = walletsResponse.ok ? walletsResponse.wallets : []

    const transactions = respTransactions.ok ? respTransactions.transactions : []

    const categories = respCategories.ok ? respCategories.categories : []

    const cycleSummary = respSummary.ok ? respSummary.data : null
    const readIssue = [walletsResponse, respTransactions, respCategories, respSummary].find((response) => !response.ok)

    return (
        <div className='space-y-6'>
            <div className='glass-panel rounded-[2rem] p-5 sm:p-6'>
                <p className='text-xs uppercase tracking-[0.32em] text-slate-500'>Actividad</p>
                <div className='mt-2 flex items-end justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold text-white md:text-3xl'>Movimientos</h1>
                        {cycleSummary && <p className='mt-1 text-sm text-slate-400'>{cycleSummary.currentCycle.label}</p>}
                    </div>
                </div>
            </div>

            {readIssue && <DataUnavailableNotice message={readIssue.message} />}

            {!walletsResponse.ok ? (
                <div className='glass-panel rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center'>
                    <h2 className='text-xl font-semibold text-white'>Movimientos no disponibles</h2>
                    <p className='mt-2 text-sm text-slate-400'>
                        No pudimos comprobar tus cuentas en este momento. Inténtalo otra vez en unos segundos.
                    </p>
                </div>
            ) : wallets && wallets.length > 0 ? (
                <>
                    <TransactionsGrid transactions={ transactions } categories={ categories } wallets={ wallets } />
                    <NewTransactionFloatingButton walletId='' />
                </>
            ) : (
                <div className='glass-panel rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center'>
                    <h2 className='text-xl font-semibold text-white'>Primero crea una cuenta</h2>
                    <p className='mt-2 text-sm text-slate-400'>
                        Necesitas al menos una cuenta para registrar movimientos.
                    </p>
                    <Link href='/billeteras/nueva' className='mt-4 inline-flex rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_25px_rgba(14,165,233,0.28)]'>
                        Crear primera cuenta
                    </Link>
                </div>
            )}
        </div>
    )
}

