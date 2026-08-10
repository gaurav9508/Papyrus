import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonLightProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--color-blue)] text-[color:var(--color-cream)] hover:opacity-90",
  secondary:
    "border border-[color:var(--color-cream-dim)] bg-white text-[color:var(--color-ink)] hover:border-[color:var(--color-blue)]",
  ghost:
    "bg-transparent text-[color:var(--color-ink)]/60 hover:bg-[color:var(--color-cream-dim)] hover:text-[color:var(--color-ink)]",
  danger: "bg-[color:var(--color-terracotta)] text-white hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const ButtonLight = forwardRef<HTMLButtonElement, ButtonLightProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonLight.displayName = "ButtonLight";
