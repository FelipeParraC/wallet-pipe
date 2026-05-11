import { redirect } from 'next/navigation'

interface Props {
  searchParams: {
    walletId?: string
  }
}

export default function NuevaTransaccionRedirectPage({ searchParams }: Props) {
  const query = searchParams.walletId ? `?walletId=${searchParams.walletId}` : ''
  redirect(`/movimientos/nueva${query}`)
}
