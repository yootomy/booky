/**
 * Badge avec variantes Dark Romance
 * Spécialement conçu pour les tags, catégories et statuts de livres
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { badgeDarkRomanceVariants, type BadgeDarkRomanceVariants } from "@/lib/theme-variants";

export interface BadgeDarkRomanceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeDarkRomanceVariants {}

function BadgeDarkRomance({ className, variant, ...props }: BadgeDarkRomanceProps) {
  return (
    <div className={cn(badgeDarkRomanceVariants({ variant }), className)} {...props} />
  );
}

export { BadgeDarkRomance, badgeDarkRomanceVariants };