import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-(--color-cream-dim) bg-white px-4 py-2 text-sm text-(--color-ink) outline-none transition-colors placeholder:text-neutral-400 focus:border-(--color-blue)",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
