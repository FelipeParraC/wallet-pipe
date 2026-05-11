import { WalletCards } from 'lucide-react'

export const AppLogoMark = ({ className = 'h-10 w-10 rounded-[1.05rem]' }: { className?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center border border-sky-200/15 bg-gradient-to-br from-sky-400/95 via-blue-600 to-slate-950 text-white shadow-[0_12px_28px_rgba(14,165,233,0.24)] ${className}`}
    aria-hidden='true'
  >
    <WalletCards className='h-[58%] w-[58%] stroke-[2.4]' />
  </span>
)
