export const revalidate = 0

import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { SecuritySettingsPanel, SettingsPageHeader } from '@/components'

export default async function SeguridadSettingsPage() {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        password: true,
        googleId: true,
      },
    })
    : null

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Seguridad' description='Revisa accesos, contraseña, sesión y acciones sensibles.' />
      <SecuritySettingsPanel
        email={user?.email ?? session?.user.email ?? ''}
        hasPassword={Boolean(user?.password)}
        hasGoogle={Boolean(user?.googleId)}
      />
    </div>
  )
}
