import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  size?: "narrow" | "default" | "wide";
  className?: string;
}

const sizeClasses: Record<NonNullable<PageContainerProps["size"]>, string> = {
  narrow: "max-w-2xl",
  default: "max-w-3xl",
  wide: "max-w-6xl",
};

export default function PageContainer({
  children,
  size = "default",
  className = "",
}: PageContainerProps) {
  const classes = [
    "mx-auto w-full px-4 md:px-6 py-10 md:py-12 animate-fade-in relative z-10",
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
