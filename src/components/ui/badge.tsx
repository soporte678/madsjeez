import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40",
        secondary:
          "border-transparent bg-gradient-to-r from-[#FFC107] to-[#FFD700] text-slate-900 shadow-md shadow-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/40",
        accent:
          "border-transparent bg-gradient-to-r from-[#00D4FF] to-[#00B4E6] text-slate-900 shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40",
        success:
          "border-transparent bg-gradient-to-r from-[#7CFC00] to-[#32CD32] text-slate-900 shadow-md shadow-lime-500/30 hover:shadow-lg hover:shadow-lime-500/40",
        warning:
          "border-transparent bg-gradient-to-r from-[#FF2E8C] to-[#FF6B9D] text-white shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40",
        outline:
          "border-2 border-[#FF6B4A] text-[#FF6B4A] hover:bg-[#FF6B4A] hover:text-white transition-colors",
        ghost:
          "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        pulse:
          "border-transparent bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white shadow-lg shadow-orange-500/40 animate-scale-pulse",
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
