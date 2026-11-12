import { cn } from "../lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "admin:flex admin:h-10 admin:w-full admin:rounded-md admin:border admin:border-input admin:bg-white admin:px-3 admin:py-2 admin:text-sm admin:text-foreground admin:outline-none admin:placeholder:text-muted-foreground admin:focus:ring-2 admin:focus:ring-ring admin:focus:ring-offset-2 admin:focus:ring-offset-white admin:disabled:cursor-not-allowed admin:disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "admin:flex admin:h-10 admin:w-full admin:rounded-md admin:border admin:border-input admin:bg-white admin:px-3 admin:py-2 admin:text-sm admin:text-foreground admin:outline-none admin:focus:ring-2 admin:focus:ring-ring admin:focus:ring-offset-2 admin:focus:ring-offset-white",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }) {
  return <label className={cn("admin:text-sm admin:font-medium admin:text-foreground", className)} {...props} />;
}

export function Field({ label, children }) {
  return (
    <div className="admin:grid admin:gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
