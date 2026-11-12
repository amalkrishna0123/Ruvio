"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FolderGit2, PhoneCall, User } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeUserConnections } from "@/lib/firebase/connections-service";

export default function BottomNavigation({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const pathname = usePathname();
  const isDark = theme === "dark";
  const { userProfile } = useAuth();
  const [hasConnections, setHasConnections] = useState(false);

  // Subscribe to connections to enable/disable Calls button
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsub = subscribeUserConnections(userProfile.id, (conns) => {
      setHasConnections(conns.length > 0);
    });
    return () => unsub();
  }, [userProfile?.id]);

  const navItems = [
    {
      label: "Chats",
      href: "/home",
      icon: MessageSquare,
      badge: 0,
      disabled: false,
    },
    {
      label: "Calls",
      href: "/calls",
      icon: PhoneCall,
      badge: 0,
      disabled: !hasConnections,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: FolderGit2,
      badge: 0,
      disabled: false,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
      badge: 0,
      disabled: false,
    },
  ];

  return (
    <nav
      className={`fixed bottom-0 z-30 flex h-16 w-full flex-shrink-0 items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] transition-colors ${
        isDark
          ? "bg-[#0A0A0C]/95 backdrop-blur-xl border-t border-white/10 text-white"
          : "bg-white/95 backdrop-blur-xl border-t border-neutral-200 text-neutral-900"
      }`}
      aria-label="Main Navigation"
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/home" && pathname?.startsWith(item.href));
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <button
              key={item.href}
              type="button"
              disabled
              className={`relative flex flex-1 flex-col items-center justify-center py-1.5 select-none cursor-not-allowed ${
                isDark ? "text-neutral-700" : "text-neutral-300"
              }`}
              title="Add a connection to use Calls"
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <span className="mt-1 text-[11px] tracking-tight font-normal">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-1 flex-col items-center justify-center py-1.5 transition-all select-none ${
              isActive
                ? isDark ? "text-white" : "text-black"
                : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <div className="relative">
              <Icon
                className={`h-5 w-5 transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
                strokeWidth={isActive ? 2.3 : 1.7}
              />
              {item.badge > 0 ? (
                <span className={`absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isDark ? "bg-white text-black" : "bg-black text-white"
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span
              className={`mt-1 text-[11px] tracking-tight ${
                isActive ? "font-semibold" : "font-normal"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
