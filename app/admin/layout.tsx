"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  FolderGit2,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <div className="min-h-dvh bg-[#F5F5F2]">{children}</div>;
  }

  const navLinks = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "User Accounts", href: "/admin/users", icon: Users },
    { label: "Projects Directory", href: "/admin/projects", icon: FolderGit2 },
  ];

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row bg-[#F5F5F2] text-[#181A19]">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#E3E5E1] bg-white flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Logo / Console brand */}
          <div className="flex items-center gap-2.5 px-2 py-3 border-b border-[#E3E5E1]/60">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F5C4A] text-white">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#181A19]">
                SignalCore Admin
              </div>
              <div className="text-[10px] text-[#6C716D]">
                Network Node Controller
              </div>
            </div>
          </div>

          {/* Links */}
          <nav className="mt-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#1F5C4A] text-white shadow-xs"
                      : "text-[#6C716D] hover:bg-[#F0F1EE] hover:text-[#181A19]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-[#E3E5E1]/60 space-y-2">
          <Link
            href="/home"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#6C716D] hover:bg-[#F0F1EE] hover:text-[#181A19] transition-colors"
          >
            <span>Open User App</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/admin/login"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#B94A48] hover:bg-[#FBEAEA] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Admin Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
