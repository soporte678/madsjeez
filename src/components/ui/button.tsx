import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-[#FF8C42] hover:to-[#FFC107] hover:-translate-y-0.5 btn-shine",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5",
        outline: "border-2 border-[#FF6B4A] bg-transparent text-[#FF6B4A] hover:bg-gradient-to-r hover:from-[#FF6B4A] hover:to-[#FF8C42] hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300",
        secondary: "bg-gradient-to-r from-[#FFC107] to-[#FFD700] text-slate-900 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 hover:-translate-y-0.5",
        accent: "bg-gradient-to-r from-[#00D4FF] to-[#00B4E6] text-slate-900 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 btn-shine",
        success: "bg-gradient-to-r from-[#7CFC00] to-[#32CD32] text-slate-900 shadow-lg shadow-lime-500/30 hover:shadow-xl hover:shadow-lime-500/40 hover:-translate-y-0.5",
        warning: "bg-gradient-to-r from-[#FF2E8C] to-[#FF6B9D] text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-0.5",
        ghost: "hover:bg-[#FF6B4A]/10 hover:text-[#FF6B4A] transition-colors duration-300",
        link: "text-[#FF6B4A] underline-offset-4 hover:underline font-semibold hover:text-[#FF8C42] transition-colors",
        glow: "bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white shadow-lg shadow-orange-500/50 animate-pulse-glow hover:shadow-xl hover:shadow-orange-500/60 hover:-translate-y-0.5 btn-shine",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-10 text-base",
        xl: "h-16 rounded-xl px-12 text-lg",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-xl",
      },
      glow: {
        true: "animate-pulse-glow",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
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
