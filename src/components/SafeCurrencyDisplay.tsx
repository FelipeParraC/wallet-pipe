'use client'

import { useEffect, useState } from 'react'

interface SafeCurrencyDisplayProps {
    amount: number
    className?: string
}

export function SafeCurrencyDisplay({ amount, className = '' }: SafeCurrencyDisplayProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Render nothing until mounted to avoid hydration mismatch
    if (!mounted) {
        return <span className={className}>$ --</span>
    }

    const formatter = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })

    return (
        <span className={className}>
            $ {formatter.format(amount)}
        </span>
    )
}

