/**
 * Command - Composant de commande/palette
 * Basé sur Radix UI Dialog et cmdk
 */

"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 🎯 INTERFACES
// =============================================================================

interface CommandProps {
  children: React.ReactNode;
  className?: string;
}

interface CommandInputProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface CommandListProps {
  children: React.ReactNode;
  className?: string;
}

interface CommandEmptyProps {
  children: React.ReactNode;
  className?: string;
}

interface CommandGroupProps {
  heading?: string;
  children: React.ReactNode;
  className?: string;
}

interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  value?: string;
  disabled?: boolean;
  className?: string;
}

// =============================================================================
// 🎨 COMPOSANTS
// =============================================================================

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground",
        "border border-border shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Command.displayName = "Command";

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, placeholder = "Rechercher...", ...props }, ref) => (
    <div className="flex items-center border-b px-3">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ heading, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-hidden p-1 text-foreground", className)}
      {...props}
    >
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {heading}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
);
CommandGroup.displayName = "CommandGroup";

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ children, onSelect, disabled, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={onSelect}
      {...props}
    >
      {children}
    </div>
  )
);
CommandItem.displayName = "CommandItem";

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
};