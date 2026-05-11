import { auth } from '@/auth.config'
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ProfileSettingsForm, SettingsInfoCard, SettingsPageHeader } from '@/components'

export default async function PerfilSettingsPage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Perfil' description='Edita cómo se ve tu cuenta dentro de Wallet Pipe.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Avatar className='h-14 w-14'>
              {user?.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className='bg-sky-500/20 text-sky-100'>{user?.name?.[0] ?? 'W'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name}</CardTitle>
              <p className='mt-1 text-sm text-slate-400'>{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SettingsInfoCard label='Correo' value={user?.email ?? ''} />
          <ProfileSettingsForm name={user?.name ?? ''} nickname={user?.nickname ?? ''} />
        </CardContent>
      </Card>
    </div>
  )
}
