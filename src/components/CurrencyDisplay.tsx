'use client'

import { useEffect, useState } from 'react'
import { currencyFormatWithSmallDecimals, currencyFormatWithoutDecimals } from '@/utils/currency'

interface CurrencyDisplayProps {
    amount: number
    showDecimals?: boolean
    className?: string
}

export function CurrencyDisplay({ amount, showDecimals = false, className = '' }: CurrencyDisplayProps) {
    const [formattedAmount, setFormattedAmount] = useState<string>('$ 0')

    useEffect(() => {
        const formatted = showDecimals
            ? currencyFormatWithSmallDecimals(amount)
            : currencyFormatWithoutDecimals(amount);
        setFormattedAmount(formatted);
    }, [amount, showDecimals])

    return (
        <div
            className={`currency-display ${className}`}
            dangerouslySetInnerHTML={{ __html: formattedAmount }}
        />
    )
}

