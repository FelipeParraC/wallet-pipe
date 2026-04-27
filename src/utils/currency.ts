const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
})

export const getCurrencyParts = (value: number) => {
    const absoluteValue = Math.abs(value)
    const wholePart = Math.trunc(absoluteValue)
    const decimalPart = Math.round((absoluteValue - wholePart) * 100)

    return {
        isNegative: value < 0,
        symbol: '$',
        wholePart: integerFormatter.format(wholePart),
        decimalPart: decimalPart.toString().padStart(2, '0'),
        full: currencyFormatter.format(value),
    }
}

export const currencyFormatWithSmallDecimals = (value: number) => {
    const parts = getCurrencyParts(value)
    const sign = parts.isNegative ? '-' : ''

    return `${sign}${parts.symbol} ${parts.wholePart}<span class="text-xs align-bottom">,${parts.decimalPart}</span>`
}

export const currencyFormatWithoutDecimals = (value: number) => {
    const parts = getCurrencyParts(value)
    const sign = parts.isNegative ? '-' : ''
    return `${sign}${parts.symbol} ${parts.wholePart}`
}

export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
    if (!options) return currencyFormatter.format(value)

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
    }).format(value)
}

export const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-500'
    if (amount < 0) return 'text-red-500'
    return 'text-yellow-500'
}
