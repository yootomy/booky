import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const kbdVariants = cva(
  "inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground border-border",
        outline: "border-2 border-border bg-background text-foreground",
      },
      size: {
        default: "h-5 min-w-[1.25rem]",
        sm: "h-4 min-w-[1rem] px-1 text-[0.65rem]",
        lg: "h-6 min-w-[1.5rem] px-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <kbd
        className={cn(kbdVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Kbd.displayName="Kbd"

export { Kbd, kbdVariants }