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
        "w-full rounded-lg border border-[#2a3541] bg-[#12181f] px-4 py-2 text-sm text-[#e6e4dc] outline-none transition-colors placeholder:text-[#4a5460] focus:border-amber-400/60",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
