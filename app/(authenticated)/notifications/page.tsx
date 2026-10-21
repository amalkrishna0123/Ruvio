"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  FolderGit2,
  PhoneMissed,
  UserCheck,
  Shield,
  CheckCheck,
} from "lucide-react";
import { sampleNotifications } from "@/lib/mock-data";
import { AppNotification } from "@/types";
import { EmptyState, BottomNavigation } from "@/components/common";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>(sampleNotifications);

  const getNotifIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-[#1F5C4A]" />;
      case "project_invite":
        return <FolderGit2 className="h-4 w-4 text-blue-600" />;
      case "call_missed":
        return <PhoneMissed className="h-4 w-4 text-[#B94A48]" />;
      case "connection_request":
        return <UserCheck className="h-4 w-4 text-emerald-600" />;
      case "system":
        return <Shield className="h-4 w-4 text-purple-600" />;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-[11px] text-[#1F5C4A] font-medium">
                {unreadCount} unread alerts
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-semibold text-[#1F5C4A] hover:underline px-2 py-1"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </header>

      {/* Notifications feed */}
      <main className="flex-1 divide-y divide-[#E3E5E1]/50 overflow-y-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-6 h-6 text-[#1F5C4A]" />}
            title="All caught up"
            description="You don't have any pending notifications or alerts."
          />
        ) : (
          notifications.map((notif) => {
            const rowContent = (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3.5 transition-colors ${
                  notif.isUnread ? "bg-[#E8F2EE]/30 hover:bg-[#E8F2EE]/50" : "hover:bg-[#FAFAF8]"
                }`}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[#E3E5E1] shadow-2xs mt-0.5">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-semibold text-[#181A19] truncate">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-[#9B9E9C] flex-shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#6C716D] line-clamp-2 leading-relaxed">
                    {notif.description}
                  </p>
                </div>

                {notif.isUnread && (
                  <span className="h-2 w-2 rounded-full bg-[#1F5C4A] mt-2 flex-shrink-0" />
                )}
              </div>
            );

            if (notif.actionUrl) {
              return (
                <Link key={notif.id} href={notif.actionUrl}>
                  {rowContent}
                </Link>
              );
            }
            return <div key={notif.id}>{rowContent}</div>;
          })
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
