import { DataUnavailableNotice } from '@/components/RouteState'

export const PlanningUnavailable = ({ message }: { message?: string }) => (
  <div className='space-y-4'>
    {message && <DataUnavailableNotice message={message} />}
    <div className='glass-panel rounded-[1.75rem] p-8 text-center'>
      <h1 className='text-xl font-semibold text-white'>No se pudo cargar Planeación</h1>
      <p className='mx-auto mt-2 max-w-md text-sm text-slate-400'>
        Si la conexión con la base de datos está intermitente, esta pantalla se recuperará al reintentar.
      </p>
    </div>
  </div>
)
