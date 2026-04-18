import type { ReactNode } from "react";
import PageTooltip from "@/components/PageTooltip";

interface PageContainerProps {
  children: ReactNode;
  size?: "narrow" | "default" | "wide";
  className?: string;
  tooltipTitle?: string;
  tooltipDescription?: string[];
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
  tooltipTitle,
  tooltipDescription,
}: PageContainerProps) {
  const hasTooltip = Boolean(tooltipTitle && tooltipDescription?.length);

  const classes = [
    "mx-auto w-full px-4 md:px-6 py-10 md:py-12 animate-fade-in relative z-10",
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {hasTooltip && tooltipTitle && tooltipDescription ? (
        <div className="relative z-40 mb-5 flex justify-end md:mb-6">
          <PageTooltip title={tooltipTitle} description={tooltipDescription} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
