import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function CardLight({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-(--color-cream-dim) bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardLightTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-semibold text-(--color-ink)", className)}
      {...props}
    />
  );
}

export function CardLightDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink/60", className)} {...props} />;
}
