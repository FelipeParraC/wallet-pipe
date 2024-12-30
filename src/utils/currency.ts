// Función auxiliar para formatear números
const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// Función para mostrar siempre dos decimales con los decimales más pequeños
export const currencyFormatWithSmallDecimals = (value: number) => {
    const wholePart = Math.floor(value)
    const decimalPart = Math.round((value - wholePart) * 100)
    const formattedWholePart = formatNumber(wholePart)
    const formattedDecimalPart = decimalPart.toString().padStart(2, '0')

    return `$ ${formattedWholePart}<span class="text-xs align-bottom">,${formattedDecimalPart}</span>`
}

export const currencyFormatWithoutDecimals = (value: number) => {
    return `$ ${formatNumber(value)}`
}

export const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-500'
    if (amount < 0) return 'text-red-500'
    return 'text-yellow-500'
}

