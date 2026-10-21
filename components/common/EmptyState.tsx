import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1EE] text-[#6C716D] mb-3.5">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#181A19]">{title}</h3>
      <p className="mt-1 text-xs text-[#6C716D] max-w-[260px] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
