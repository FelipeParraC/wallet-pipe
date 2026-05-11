import { redirect } from 'next/navigation'

interface Props {
  params: {
    id: string
  }
  searchParams: {
    walletId?: string
  }
}

export default function EditarTransaccionRedirectPage({ params, searchParams }: Props) {
  const query = searchParams.walletId ? `?walletId=${searchParams.walletId}` : ''
  redirect(`/movimientos/editar/${params.id}${query}`)
}
