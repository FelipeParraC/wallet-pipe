'use client'

import { RouteErrorState } from '@/components'

export default function WalletError({ reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <RouteErrorState
      title='No pudimos cargar tus finanzas'
      description='Tus datos siguen guardados. Hubo un problema temporal mostrando esta pantalla.'
      onRetry={reset}
    />
  )
}
