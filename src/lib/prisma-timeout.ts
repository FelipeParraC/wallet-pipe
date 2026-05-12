export class PrismaOperationTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`La operación ${label} tardó más de ${timeoutMs}ms`)
    this.name = 'PrismaOperationTimeoutError'
  }
}

const DEFAULT_TIMEOUT_MS = 2500

export const withPrismaTimeout = async <T>(
  operation: () => Promise<T>,
  label: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new PrismaOperationTimeoutError(label, timeoutMs)), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export const isPrismaConnectionIssue = (error: unknown) => {
  if (error instanceof PrismaOperationTimeoutError) return true

  const code = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: string }).code
    : undefined

  if (code && ['P1001', 'P1002', 'P1017'].includes(code)) return true

  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes("Can't reach database server")
    || message.includes('Timed out')
    || message.includes('Connection')
  )
}
