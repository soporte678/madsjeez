import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-brand-flare to-secondary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:from-primary-hover hover:via-brand-flare hover:to-secondary-hover hover:-translate-y-0.5 btn-shine",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive-hover text-destructive-foreground shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-gradient-to-r hover:from-primary hover:via-brand-flare hover:to-secondary-hover hover:text-primary-foreground hover:border-transparent hover:shadow-lg hover:shadow-primary/25 transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary-hover hover:shadow-lg hover:-translate-y-0.5",
        accent:
          "bg-gradient-to-r from-accent to-accent-hover text-accent-foreground shadow-lg shadow-cyan-500/35 hover:shadow-xl hover:shadow-cyan-500/45 hover:-translate-y-0.5 btn-shine",
        success:
          "bg-gradient-to-r from-success to-success-hover text-success-foreground shadow-lg shadow-emerald-500/35 hover:shadow-xl hover:shadow-emerald-500/45 hover:-translate-y-0.5",
        warning:
          "bg-warning text-warning-foreground shadow-lg shadow-warning/30 hover:bg-warning-hover hover:shadow-xl hover:shadow-warning/40 hover:-translate-y-0.5",
        ghost: "hover:bg-primary/10 hover:text-primary transition-colors duration-300",
        link: "text-primary underline-offset-4 hover:underline font-semibold hover:text-primary-hover transition-colors",
        glow:
          "bg-gradient-to-r from-primary via-brand-flare to-secondary text-primary-foreground shadow-lg shadow-primary/45 animate-pulse-glow hover:shadow-xl hover:shadow-primary/55 hover:-translate-y-0.5 btn-shine",
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
