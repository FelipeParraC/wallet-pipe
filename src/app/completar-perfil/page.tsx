import { auth } from '@/auth.config'
import { CompleteProfileForm } from '@/components'
import { redirect } from 'next/navigation'

export default async function CompletarPerfilPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (session.user.nickname?.trim()) {
    redirect('/')
  }

  return (
    <main className='container mx-auto flex min-h-screen items-center justify-center px-4 py-10'>
      <CompleteProfileForm defaultName={session.user.name} />
    </main>
  )
}
