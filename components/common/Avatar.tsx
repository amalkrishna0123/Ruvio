import React from "react";
import { UserStatus } from "@/types";

interface AvatarProps {
  name: string;
  userNumber?: string;
  avatarUrl?: string;
  status?: UserStatus;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  darkBorder?: boolean;
}

export default function Avatar({
  name,
  userNumber,
  avatarUrl,
  status,
  size = "md",
  className = "",
  darkBorder = false,
}: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase() || "WA";
  };

  const sizeClasses = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-2xl font-semibold",
  };

  const statusSize = {
    xs: "w-2 h-2 bottom-0 right-0 border",
    sm: "w-2.5 h-2.5 bottom-0 right-0 border-[1.5px]",
    md: "w-3 h-3 bottom-0 right-0.5 border-2",
    lg: "w-3.5 h-3.5 bottom-0.5 right-0.5 border-2",
    xl: "w-4 h-4 bottom-1 right-1 border-2",
  };

  const statusColors: Record<UserStatus, string> = {
    online: "bg-[#22C55E]", // Vibrant green from screenshots
    away: "bg-[#F59E0B]",
    busy: "bg-[#EF4444]",
    offline: "bg-[#9CA3AF]",
  };

  const borderColor = darkBorder ? "border-[#0C0C0E]" : "border-white";

  return (
    <div className={`relative inline-flex flex-shrink-0 items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-neutral-200 text-neutral-800 font-semibold flex items-center justify-center select-none overflow-hidden ring-1 ring-black/5 shadow-2xs`}
        title={userNumber ? `${name} (#${userNumber})` : name}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <span className="opacity-80">{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute rounded-full ${borderColor} ${statusSize[size]} ${statusColors[status]}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
