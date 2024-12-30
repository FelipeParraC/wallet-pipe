import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionActions } from "@/components/transactions/TransactionActions"
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { getAmountColor } from "@/utils/currency"
import { Transaction } from "@/interfaces"

interface TransactionCardProps {
    transaction: Transaction
    onEdit: (transaction: Transaction, e: React.MouseEvent) => void
    onDelete: (id: string, e: React.MouseEvent) => void
    onClick: () => void
}

export function TransactionCard({ transaction, onEdit, onDelete, onClick }: TransactionCardProps) {
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
                        className={`text-lg font-bold ${transaction.category === 'Transferencia' ? 'text-blue-400' : getAmountColor(transaction.amount)}`}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="card-content">
                    <p className="text-sm text-muted-foreground mb-1">{transaction.category}</p>
                    <p className="text-sm text-muted-foreground mb-1">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                        {format(parseISO(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex justify-end mt-2">
                    <TransactionActions
                        onEdit={(e) => {
                            e.stopPropagation()
                            onEdit(transaction, e)
                        }}
                        onDelete={(e) => {
                            e.stopPropagation()
                            onDelete(transaction.id, e)
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

