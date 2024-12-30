import { format } from 'date-fns'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { es } from 'date-fns/locale'
import { getAmountColor } from '@/utils'
import type { Transaction } from '@/interfaces'

interface RecentTransactionItemProps {
    transaction: Transaction
}


export const RecentTransactionItem = ({ transaction }: RecentTransactionItemProps) => {
    return (
        <div className='flex items-center'>
            <div className='space-y-1'>
                <p className='text-sm font-medium leading-none'>{ transaction.title }</p>
                <p className='text-xs text-muted-foreground'>{ transaction.category }</p>
                <p className='text-xs text-muted-foreground'>
                    {format(new Date( transaction.date ), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
            </div>
            <div className={`ml-auto font-medium ${ transaction.category !== 'Transferencia' ? getAmountColor( transaction.amount ) : 'text-blue-400' }`}>
                <CurrencyDisplay
                    amount={ Math.abs( transaction.amount ) }
                    showDecimals={ true }
                />
            </div>
        </div>
    )
}
