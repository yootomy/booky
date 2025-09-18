/**
 * Carte avec variantes Dark Romance
 * Extension du composant Card standard avec des styles spécialisés
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { cardDarkRomanceVariants, type CardDarkRomanceVariants } from "@/lib/theme-variants";

export interface CardDarkRomanceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardDarkRomanceVariants {}

const CardDarkRomance = React.forwardRef<HTMLDivElement, CardDarkRomanceProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardDarkRomanceVariants({ variant, className }))}
      {...props}
    />
  )
);
CardDarkRomance.displayName = "CardDarkRomance";

const CardDarkRomanceHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardDarkRomanceHeader.displayName = "CardDarkRomanceHeader";

const CardDarkRomanceTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardDarkRomanceTitle.displayName = "CardDarkRomanceTitle";

const CardDarkRomanceDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDarkRomanceDescription.displayName = "CardDarkRomanceDescription";

const CardDarkRomanceContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardDarkRomanceContent.displayName = "CardDarkRomanceContent";

const CardDarkRomanceFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardDarkRomanceFooter.displayName = "CardDarkRomanceFooter";

export {
  CardDarkRomance,
  CardDarkRomanceHeader,
  CardDarkRomanceFooter,
  CardDarkRomanceTitle,
  CardDarkRomanceDescription,
  CardDarkRomanceContent,
};