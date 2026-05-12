import { isPrismaConnectionIssue } from './prisma-timeout'

export type ServerErrorKind = 'domain' | 'session' | 'infrastructure' | 'unknown'

const SESSION_ERROR_MESSAGE = 'Debes iniciar sesión de nuevo.'
const INFRASTRUCTURE_ERROR_MESSAGE = 'No pudimos conectar con la base de datos. Inténtalo de nuevo en un momento.'
const UNKNOWN_ERROR_MESSAGE = 'Ocurrió un error inesperado'

const isKnownDomainError = (message: string) => (
  Boolean(message)
  && !message.includes("Can't reach database server")
  && !message.includes('PrismaClient')
  && !message.includes('Invalid `prisma.')
)

export const classifyServerError = (error: unknown): ServerErrorKind => {
  if (isPrismaConnectionIssue(error)) return 'infrastructure'

  const message = error instanceof Error ? error.message : String(error ?? '')
  if (message === 'No hay sesión de usuario') return 'session'
  if (error instanceof Error && isKnownDomainError(message)) return 'domain'

  return 'unknown'
}

export const getSafeErrorMessage = (error: unknown) => {
  const kind = classifyServerError(error)
  if (kind === 'infrastructure') return INFRASTRUCTURE_ERROR_MESSAGE
  if (kind === 'session') return SESSION_ERROR_MESSAGE
  if (kind === 'domain' && error instanceof Error) return error.message
  return UNKNOWN_ERROR_MESSAGE
}

export const logServerActionError = (action: string, error: unknown) => {
  const kind = classifyServerError(error)
  const errorObject = error instanceof Error ? error : undefined

  console.error('[server-action:error]', {
    action,
    kind,
    message: getSafeErrorMessage(error),
    rawMessage: errorObject?.message ?? String(error),
    stack: errorObject?.stack,
    timestamp: new Date().toISOString(),
  })
}
