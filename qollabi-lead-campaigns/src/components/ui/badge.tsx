import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-light text-brand",
        secondary: "border-transparent bg-gray-100 text-muted",
        destructive: "border-transparent bg-red-50 text-red-600",
        success: "border-transparent bg-green-50 text-green-600",
        warning: "border-transparent bg-amber-50 text-amber-700",
        outline: "border-b2 text-foreground bg-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
