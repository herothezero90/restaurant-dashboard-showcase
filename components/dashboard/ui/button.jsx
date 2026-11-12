import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "admin:inline-flex admin:items-center admin:justify-center admin:gap-2 admin:whitespace-nowrap admin:rounded-md admin:text-sm admin:font-medium admin:transition-colors admin:focus-visible:outline-none admin:focus-visible:ring-2 admin:focus-visible:ring-ring admin:focus-visible:ring-offset-2 admin:focus-visible:ring-offset-background admin:disabled:pointer-events-none admin:disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "admin:bg-primary admin:text-primary-foreground admin:hover:bg-primary/90",
        secondary: "admin:bg-secondary admin:text-secondary-foreground admin:hover:bg-secondary/80",
        outline: "admin:border admin:border-input admin:bg-background admin:text-foreground admin:hover:bg-accent admin:hover:text-accent-foreground",
        ghost: "admin:text-foreground admin:hover:bg-accent admin:hover:text-accent-foreground",
        destructive: "admin:bg-destructive admin:text-destructive-foreground admin:hover:bg-destructive/90",
      },
      size: {
        default: "admin:h-10 admin:px-4 admin:py-2",
        sm: "admin:h-9 admin:rounded-md admin:px-3",
        icon: "admin:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, type = "button", ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
