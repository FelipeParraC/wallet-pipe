import { DataUnavailableNotice } from '@/components/RouteState'
import { DataState, PageStack } from '@/components/layout/PagePrimitives'

export const PlanningUnavailable = ({ message }: { message?: string }) => (
  <PageStack>
    {message && <DataUnavailableNotice message={message} />}
    <DataState
      title='No se pudo cargar Planeación'
      description='Si la conexión con la base de datos está intermitente, esta pantalla se recuperará al reintentar.'
    />
  </PageStack>
)
