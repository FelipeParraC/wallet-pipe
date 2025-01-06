export const capitalizar = (input: string): string => {
    return input
        .trim() // Elimina espacios al inicio y final
        .split(/\s+/) // Divide por uno o más espacios consecutivos
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
}