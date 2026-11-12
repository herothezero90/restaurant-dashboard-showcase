import { cn } from "../lib/utils";

export function Table({ className, ...props }) {
  return <table className={cn("admin:w-full admin:caption-bottom admin:text-sm", className)} {...props} />;
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("admin:bg-card admin:[&_tr]:border-b admin:[&_tr]:border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return (
    <tbody
      className={cn(
        "admin:[&_tr:last-child]:border-0",
        "admin:[&_tr:nth-child(odd)]:bg-[#fcfcfc] admin:[&_tr:nth-child(odd)]:hover:bg-[#f5f5f5]",
        "admin:[&_tr:nth-child(even)]:bg-[#ffffff] admin:[&_tr:nth-child(even)]:hover:bg-[#f7f7f7]",
        className
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "admin:border-b admin:border-border admin:transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "admin:h-12 admin:px-4 admin:text-left admin:align-middle admin:text-xs admin:font-medium admin:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn("admin:px-4 admin:py-4 admin:align-middle", className)} {...props} />;
}
