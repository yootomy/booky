/**
 * Bouton avec variantes Dark Romance
 * Extension du composant Button standard avec des styles spécialisés
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { buttonDarkRomanceVariants, type ButtonDarkRomanceVariants } from "@/lib/theme-variants";

export interface ButtonDarkRomanceProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonDarkRomanceVariants {
  asChild?: boolean;
}

const ButtonDarkRomance = React.forwardRef<HTMLButtonElement, ButtonDarkRomanceProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonDarkRomanceVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonDarkRomance.displayName="ButtonDarkRomance";

export { ButtonDarkRomance, buttonDarkRomanceVariants };