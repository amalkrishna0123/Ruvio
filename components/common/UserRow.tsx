"use client";

import React from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { UserStatus } from "@/types";
import { Pin, VolumeX, Check, CheckCheck, Image as ImageIcon } from "lucide-react";

interface UserRowProps {
  href?: string;
  onClick?: () => void;
  name: string;
  userNumber?: string;
  avatarUrl?: string;
  status?: UserStatus;
  subtitle?: string;
  timestamp?: string;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  messageStatus?: "sent" | "delivered" | "read";
  isOutgoing?: boolean;
  hasPhotoMedia?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
  theme?: "dark" | "light";
}

export default function UserRow({
  href,
  onClick,
  name,
  userNumber,
  avatarUrl,
  status,
  subtitle,
  timestamp,
  unreadCount = 0,
  isPinned = false,
  isMuted = false,
  messageStatus,
  isOutgoing = false,
  hasPhotoMedia = false,
  rightAction,
  className = "",
  theme = "dark",
}: UserRowProps) {
  const isDark = theme === "dark";

  const content = (
    <div
      className={`group flex items-center gap-3.5 px-4 py-3.5 transition-all select-none cursor-pointer ${
        isDark
          ? "hover:bg-white/[0.04] active:bg-white/[0.08] text-white"
          : "hover:bg-neutral-100/70 active:bg-neutral-200/60 text-neutral-900 border-b border-neutral-100"
      } ${className}`}
      onClick={onClick}
    >
      <Avatar
        name={name}
        userNumber={userNumber}
        avatarUrl={avatarUrl}
        status={status}
        size="md"
        darkBorder={isDark}
      />

      <div className="flex flex-1 flex-col min-w-0 justify-center">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-[15px] font-semibold tracking-tight ${
              isDark ? "text-white" : "text-neutral-900"
            }`}
          >
            {name}
          </span>
          {timestamp && (
            <span
              className={`text-[12px] font-normal flex-shrink-0 tracking-tight ${
                unreadCount > 0
                  ? isDark ? "text-white font-medium" : "text-emerald-600 font-semibold"
                  : isDark ? "text-[#8E8E93]" : "text-neutral-400"
              }`}
            >
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div
            className={`flex items-center gap-1.5 min-w-0 text-[13px] ${
              isDark ? "text-[#8E8E93]" : "text-neutral-500"
            }`}
          >
            {isOutgoing && messageStatus && (
              <span className="flex-shrink-0 text-white/90">
                {messageStatus === "read" ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.2} />
                ) : (
                  <Check className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={2} />
                )}
              </span>
            )}
            {hasPhotoMedia && (
              <span className="inline-block w-3.5 h-3.5 rounded-xs bg-[#5E5E62] flex-shrink-0" />
            )}
            <span className="truncate">{subtitle || (userNumber ? `#${userNumber}` : "")}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isMuted && (
              <VolumeX className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={1.75} />
            )}
            {isPinned && (
              <Pin className="w-3.5 h-3.5 text-[#8E8E93]" strokeWidth={1.75} />
            )}
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white text-black px-1.5 text-[11px] font-bold">
                {unreadCount}
              </span>
            )}
            {rightAction}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
