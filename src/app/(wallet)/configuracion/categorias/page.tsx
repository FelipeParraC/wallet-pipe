export const revalidate = 0

import { getSettingsOverview } from '@/actions'
import { CategoryManager, SettingsPageHeader } from '@/components'

export default async function CategoriasSettingsPage() {
  const overviewResponse = await getSettingsOverview()
  const categories = overviewResponse.ok && overviewResponse.data ? overviewResponse.data.categories : []

  return (
    <div className='space-y-5'>
      <SettingsPageHeader title='Categorías' description='Crea y organiza categorías para movimientos y planeación.' />
      <CategoryManager categories={categories} />
    </div>
  )
}
