import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 text-primary-foreground shadow-[0_14px_30px_rgba(14,165,233,0.28)] hover:brightness-110",
        destructive:
          "bg-gradient-to-b from-rose-400 to-rose-600 text-destructive-foreground shadow-[0_14px_30px_rgba(244,63,94,0.24)] hover:brightness-110",
        outline:
          "border border-white/10 bg-white/[0.06] text-slate-100 shadow-[0_10px_30px_rgba(2,6,23,0.18)] backdrop-blur-xl hover:border-sky-300/30 hover:bg-white/[0.1]",
        secondary:
          "bg-slate-800/80 text-secondary-foreground shadow-[0_12px_24px_rgba(2,6,23,0.2)] backdrop-blur-xl hover:bg-slate-700/80",
        ghost: "text-slate-200 hover:bg-white/[0.08] hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-3.5 text-xs",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
