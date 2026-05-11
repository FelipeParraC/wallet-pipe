import { WalletCards } from 'lucide-react'

export const AppLogoMark = ({ className = 'h-10 w-10' }: { className?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_12px_28px_rgba(14,165,233,0.26)] ${className}`}
    aria-hidden='true'
  >
    <WalletCards className='h-[56%] w-[56%] stroke-[2.35]' />
  </span>
)
