export const revalidate = 0

import Link from 'next/link'
import { DataState, DataUnavailableNotice, EmptyState, NewTransactionFloatingButton, PageHeader, PageStack, TransactionsGrid } from '@/components'
import { getCategories, getCurrentCycleSummary, getTransactions, getWallets } from '@/actions'
import { Button } from '@/components/ui'

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
        <PageStack>
            <PageHeader
                eyebrow='Actividad'
                title='Movimientos'
                description={cycleSummary ? cycleSummary.currentCycle.label : 'Historial auditable de ingresos, gastos, tarjetas y movimientos internos.'}
            />

            {readIssue && <DataUnavailableNotice message={readIssue.message} />}

            {!walletsResponse.ok ? (
                <DataState
                    title='Movimientos no disponibles'
                    description='No pudimos comprobar tus cuentas en este momento. Inténtalo otra vez en unos segundos.'
                />
            ) : wallets && wallets.length > 0 ? (
                <>
                    <TransactionsGrid transactions={ transactions } categories={ categories } wallets={ wallets } />
                    <NewTransactionFloatingButton walletId='' />
                </>
            ) : (
                <EmptyState
                    title='Primero crea una cuenta'
                    description='Necesitas al menos una cuenta para registrar movimientos.'
                    action={<Button asChild><Link href='/billeteras/nueva'>Crear primera cuenta</Link></Button>}
                />
            )}
        </PageStack>
    )
}

