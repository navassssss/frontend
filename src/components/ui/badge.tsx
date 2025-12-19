import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors border-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive-light text-destructive",
        outline: "border border-border text-foreground bg-transparent",
        success: "bg-success-light text-success",
        warning: "bg-warning-light text-warning-foreground",
        info: "bg-info-light text-info",
        accent: "bg-accent-light text-accent-foreground",
        pending: "bg-warning-light text-warning-foreground",
        completed: "bg-success-light text-success",
        missed: "bg-destructive-light text-destructive",
        open: "bg-info-light text-info",
        resolved: "bg-success-light text-success",
        low: "bg-secondary text-secondary-foreground",
        medium: "bg-warning-light text-warning-foreground",
        high: "bg-destructive-light text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
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
