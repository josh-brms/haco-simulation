import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-green-600/40 bg-green-600/15 text-green-400",
        secondary: "border-zinc-700 bg-zinc-800 text-zinc-300",
        success: "border-emerald-600/40 bg-emerald-600/15 text-emerald-400",
        warning: "border-amber-600/40 bg-amber-600/15 text-amber-400",
        destructive: "border-red-600/40 bg-red-600/15 text-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
