import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-stone-300 px-4 py-2 text-sm outline-none transition-colors focus:border-stone-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
