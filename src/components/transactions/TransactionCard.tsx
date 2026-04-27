'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Category, Transaction } from "@/interfaces"
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { TransactionActions } from './TransactionActions'
import { getAmountColor } from '@/utils'
import { useRouter } from 'next/navigation'
import { deleteTransactionById } from '@/actions'

const transactionTypeLabel: Record<Transaction['type'], string> = {
    INGRESO: 'Ingreso',
    GASTO: 'Gasto',
    TRANSPORTE: 'Transporte',
    TRANSFERENCIA: 'Transferencia',
    TARJETA_CONSUMO: 'Consumo con tarjeta',
    PAGO_TARJETA: 'Pago de tarjeta',
    DEUDA_PRESTAMO: 'Deuda / préstamo',
    DEUDA_ABONO: 'Abono a deuda',
}

interface TransactionCardProps {
    transaction: Transaction
    categories: Category[]
    onClick: () => void
}

export const TransactionCard = ({ transaction, categories, onClick }: TransactionCardProps) => {

    const router = useRouter()

    const onEdit = () => {
        router.push(`/transacciones/editar/${ transaction.id }`)
        router.refresh()
    }

    const onDelete = async ( id: string ) => {
        const response = await deleteTransactionById( id )
        if (response.ok) {
            router.refresh()
        }
    }

    return (
        <Card
            className="cursor-pointer rounded-[1.75rem] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,6,23,0.24)]"
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (e.currentTarget === target || target.closest('.card-content')) {
                    onClick()
                }
            }}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                    <span className="truncate text-white">{transaction.title}</span>
                    <CurrencyDisplay
                        amount={Math.abs(transaction.amount)}
                        showDecimals={true}
                        className={`text-lg font-bold ${transaction.type === 'TRANSFERENCIA' ? 'text-blue-400' : getAmountColor(transaction.amount)}`}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="card-content space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        {transactionTypeLabel[transaction.type]}
                        {transaction.categoryId ? ` · ${categories.find( c => c.id === transaction.categoryId )?.name ?? 'Sin categoría'}` : ''}
                    </p>
                    {transaction.description && (
                        <p className="text-sm text-slate-300">{ transaction.description }</p>
                    )}
                    <p className="text-sm text-slate-500">
                        {format(parseISO(transaction.occurredAt || transaction.date), "d 'de' MMMM, yyyy · HH:mm:ss", { locale: es })}
                    </p>
                </div>
                <div className="mt-3 flex justify-end">
                    <TransactionActions
                        onEdit={ onEdit }
                        onDelete={() => { onDelete( transaction.id ) }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

