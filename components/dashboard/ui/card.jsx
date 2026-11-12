import * as React from "react";
import { cn } from "../lib/utils";

export const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn("admin:rounded-lg admin:border admin:border-border admin:bg-card admin:text-card-foreground admin:shadow-sm", className)} {...props} />;
});

export function CardHeader({ className, ...props }) {
  return <div className={cn("admin:flex admin:flex-col admin:gap-1.5 admin:p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("admin:text-lg admin:font-semibold", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("admin:p-5 admin:pt-0", className)} {...props} />;
}
