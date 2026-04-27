'use client'

import { formatCurrency } from '@/utils'

interface SafeCurrencyDisplayProps {
    amount: number
    className?: string
}

export const SafeCurrencyDisplay = ({ amount, className = '' }: SafeCurrencyDisplayProps) => {
    return (
        <span className={className}>
            {formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
    )
}

