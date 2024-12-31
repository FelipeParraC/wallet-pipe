'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Category, Transaction } from "@/interfaces"
import { Card, CardContent, CardHeader, CardTitle } from '../ui'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { TransactionActions } from './TransactionActions'
import { getAmountColor } from '@/utils'
import { useRouter } from 'next/navigation'


interface TransactionCardProps {
    transaction: Transaction
    categories: Category[]
    onClick: () => void
}

export const TransactionCard = ({ transaction, categories, onClick }: TransactionCardProps) => {

    const router = useRouter()

    const onEdit = () => {
        router.push(`/transacciones/editar/${ transaction.id }`)
    }

    const onDelete = ( id: string ) => {
        console.log({ id })
        //TODO: Ya veremos qué se hace
    }

    return (
        <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (e.currentTarget === target || target.closest('.card-content')) {
                    onClick()
                }
            }}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                    <span className="truncate">{transaction.title}</span>
                    <CurrencyDisplay
                        amount={Math.abs(transaction.amount)}
                        showDecimals={true}
                        className={`text-lg font-bold ${transaction.type === 'TRANSFERENCIA' ? 'text-blue-400' : getAmountColor(transaction.amount)}`}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="card-content">
                    <p className="text-sm text-muted-foreground mb-1">{ categories.find( c => c.id === transaction.categoryId )?.name }</p>
                    <p className="text-sm text-muted-foreground mb-1">{ transaction.description }</p>
                    <p className="text-sm text-muted-foreground mb-2">
                        {format(parseISO(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex justify-end mt-2">
                    <TransactionActions
                        onEdit={ onEdit }
                        onDelete={() => { onDelete( transaction.id ) }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

