import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary via-brand-flare to-secondary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35",
        secondary:
          "border-transparent bg-gradient-to-r from-secondary to-secondary-hover text-secondary-foreground shadow-md shadow-amber-500/35 hover:shadow-lg hover:shadow-amber-500/45",
        accent:
          "border-transparent bg-gradient-to-r from-accent to-accent-hover text-accent-foreground shadow-md shadow-cyan-500/35 hover:shadow-lg hover:shadow-cyan-500/45",
        success:
          "border-transparent bg-gradient-to-r from-success to-success-hover text-success-foreground shadow-md shadow-emerald-500/35 hover:shadow-lg hover:shadow-emerald-500/45",
        warning:
          "border-transparent bg-gradient-to-r from-warning via-pink-500 to-pink-400 text-warning-foreground shadow-md shadow-pink-500/35 hover:shadow-lg hover:shadow-pink-500/45",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive to-destructive-hover text-destructive-foreground shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40",
        outline:
          "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors",
        ghost:
          "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        pulse:
          "border-transparent bg-gradient-to-r from-primary via-brand-flare to-secondary text-primary-foreground shadow-lg shadow-primary/40 animate-scale-pulse",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
