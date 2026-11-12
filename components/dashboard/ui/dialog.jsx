"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { geist } from "../../../app/(dashboard)/fonts";
import { cn } from "../lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>{children}</DialogPrimitive.Root>;
}

export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({ className, children, wide = false }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="admin:fixed admin:inset-0 admin:z-[1000] admin:bg-black/60 admin:backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        className={cn(
          "dashboard-theme",
          geist.variable,
          "admin:fixed admin:left-1/2 admin:top-1/2 admin:z-[1001] admin:h-auto admin:max-h-[90vh] admin:w-[calc(100%-2rem)] admin:-translate-x-1/2 admin:-translate-y-1/2 admin:overflow-y-auto admin:rounded-lg admin:border admin:border-border admin:bg-white admin:p-6 admin:font-sans admin:text-foreground admin:shadow-xl admin:outline-none",
          wide ? "admin:max-w-2xl" : "admin:max-w-md",
          className
        )}
      >
        {children}
        <DialogPrimitive.Close className="admin:absolute admin:right-4 admin:top-4 admin:rounded-sm admin:p-1 admin:text-muted-foreground admin:hover:bg-accent admin:hover:text-accent-foreground">
          <X size={18} />
          <span className="admin:sr-only">Zatvori</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = ({ className, ...props }) => (
  <DialogPrimitive.Title className={cn("admin:text-lg admin:font-semibold", className)} {...props} />
);

export const DialogDescription = ({ className, ...props }) => (
  <DialogPrimitive.Description className={cn("admin:mt-2 admin:text-sm admin:text-muted-foreground", className)} {...props} />
);

export function DialogFooter({ className, ...props }) {
  return <div className={cn("admin:mt-6 admin:flex admin:justify-end admin:gap-2", className)} {...props} />;
}
