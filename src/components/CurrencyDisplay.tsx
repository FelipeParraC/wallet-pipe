'use client'

import { currencyFormatWithoutDecimals, currencyFormatWithSmallDecimals } from '@/utils'

interface CurrencyDisplayProps {
    amount: number
    showDecimals?: boolean
    className?: string
}

export function CurrencyDisplay({ amount, showDecimals = false, className = '' }: CurrencyDisplayProps) {
    const formattedAmount = showDecimals
        ? currencyFormatWithSmallDecimals(amount)
        : currencyFormatWithoutDecimals(amount)

    return (
        <div
            className={`currency-display ${className}`}
            dangerouslySetInnerHTML={{ __html: formattedAmount }}
        />
    )
}

