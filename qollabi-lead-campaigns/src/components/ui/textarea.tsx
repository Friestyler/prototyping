import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full rounded-lg border border-b2 bg-white py-[9px] px-[13px] font-sans text-[13px] outline-none placeholder:text-light focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)] transition-all resize-y min-h-[88px] leading-relaxed disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
