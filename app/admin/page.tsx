"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  Server,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { sampleUsers, sampleProjects } from "@/lib/mock-data";
import { Avatar } from "@/components/common";

export default function AdminDashboardPage() {
  const metrics = [
    {
      title: "Registered Users",
      value: "1,428",
      sub: "+12 this week",
      icon: Users,
    },
    {
      title: "Active Workspaces",
      value: "84",
      sub: "100% encrypted",
      icon: FolderGit2,
    },
    {
      title: "Relay Node Load",
      value: "18.4%",
      sub: "Zurich Enclave",
      icon: Server,
    },
    {
      title: "Protocol Health",
      value: "99.98%",
      sub: "Double-Ratchet v2.4",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
            System Controller Overview
          </h1>
          <p className="text-xs text-[#6C716D]">
            Live operational status of SignalCore network infrastructure
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#164638] transition-colors shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create User</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-[#E3E5E1] bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between text-[#6C716D] mb-2">
                <span className="text-xs font-medium">{m.title}</span>
                <Icon className="h-4 w-4 text-[#1F5C4A]" />
              </div>
              <div className="text-2xl font-bold text-[#181A19]">{m.value}</div>
              <div className="text-[11px] text-[#2F7D5B] font-medium mt-1">
                {m.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Tables: Recent Users & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#181A19]">
              Recently Registered Users
            </h2>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-[#1F5C4A] hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E3E5E1]/50">
            {sampleUsers.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={user.name} size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-[#181A19]">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-[#6C716D]">
                      #{user.userNumber} · {user.email}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/admin/users/${user.id}`}
                  className="rounded-lg border border-[#E3E5E1] px-2 py-1 text-[11px] font-medium text-[#181A19] hover:bg-[#F0F1EE]"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#181A19]">
              Active Workspaces
            </h2>
            <Link
              href="/admin/projects"
              className="text-xs font-semibold text-[#1F5C4A] hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E3E5E1]/50">
            {sampleProjects.slice(0, 4).map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <div className="text-xs font-semibold text-[#181A19]">
                    {proj.name}
                  </div>
                  <div className="text-[11px] text-[#6C716D]">
                    {proj.memberCount} members · Owner: {proj.owner.name}
                  </div>
                </div>

                <span className="rounded bg-[#E8F2EE] px-2 py-0.5 text-[10px] font-semibold text-[#1F5C4A] uppercase">
                  {proj.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
