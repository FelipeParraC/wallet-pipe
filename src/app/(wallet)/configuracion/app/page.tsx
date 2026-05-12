import { SettingsInfoCard, SettingsPageHeader } from '@/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { getAppDisplayName, getAppEnvironment } from '@/lib/app-environment'

export default function AppSettingsPage() {
  const appName = getAppDisplayName()
  const environment = getAppEnvironment()

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='App/PWA' description='Información rápida para usar Wallet Pipe como app instalada.' />
      <Card className='rounded-[1.75rem]'>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SettingsInfoCard label='Aplicación' value={appName} />
          <SettingsInfoCard label='Ambiente' value={environment} />
          <SettingsInfoCard label='Modo recomendado' value='Instalada en pantalla de inicio' />
          <SettingsInfoCard label='Tema' value='Oscuro mobile-first' />
          <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400'>
            Si la instalas como app, mantendrás acceso rápido y una experiencia más limpia en móvil.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
