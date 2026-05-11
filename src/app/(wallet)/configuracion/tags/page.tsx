export const revalidate = 0

import { getSettingsOverview } from '@/actions'
import { SettingsPageHeader, TagManager } from '@/components'

export default async function TagsSettingsPage() {
  const overviewResponse = await getSettingsOverview()
  const tags = overviewResponse.ok && overviewResponse.data ? overviewResponse.data.tags : []

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Tags' description='Administra etiquetas para encontrar movimientos más rápido.' />
      <TagManager tags={tags} />
    </div>
  )
}
