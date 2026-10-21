"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  border?: boolean;
  className?: string;
}

export default function MobileHeader({
  title,
  subtitle,
  backHref,
  onBack,
  leftAction,
  rightAction,
  border = true,
  className = "",
}: MobileHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-14 w-full flex-shrink-0 items-center justify-between bg-white px-3.5 transition-colors ${
        border ? "border-b border-[#E3E5E1]" : ""
      } ${className}`}
    >
      {/* Left Area */}
      <div className="flex items-center gap-2 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        ) : onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
        ) : null}

        {leftAction}

        <div className="flex flex-col min-w-0 leading-tight">
          <h1 className="truncate text-base font-semibold tracking-tight text-[#181A19]">
            {title}
          </h1>
          {subtitle && (
            <span className="truncate text-xs font-normal text-[#6C716D]">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Action */}
      {rightAction && <div className="flex items-center gap-1 flex-shrink-0">{rightAction}</div>}
    </header>
  );
}
