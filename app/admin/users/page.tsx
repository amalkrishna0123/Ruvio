"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus, Search, MoreHorizontal, ShieldCheck, Filter } from "lucide-react";
import { sampleUsers } from "@/lib/mock-data";
import { Avatar } from "@/components/common";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = sampleUsers.filter((u) => {
    const matches =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.userNumber.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
            User Account Management
          </h1>
          <p className="text-xs text-[#6C716D]">
            Manage cryptographic identity records and assigned 6-digit IDs
          </p>
        </div>

        <Link
          href="/admin/users/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#164638] transition-colors shadow-xs"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Provision New User</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C716D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, #ID, or email..."
            className="h-10 w-full rounded-xl bg-white pl-9.5 pr-4 text-xs text-[#181A19] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl bg-white px-3 text-xs text-[#181A19] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
        >
          <option value="all">All Statuses</option>
          <option value="online">Online</option>
          <option value="away">Away</option>
          <option value="offline">Offline</option>
          <option value="busy">Busy</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E3E5E1] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E5E1] bg-[#FAFAF8] text-[11px] font-semibold uppercase tracking-wider text-[#6C716D]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Assigned #ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E5E1]/60 text-xs">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <div className="font-semibold text-[#181A19]">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-[#6C716D]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#1F5C4A]">
                    #{user.userNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F0F1EE] px-2 py-0.5 text-[11px] font-medium text-[#181A19] capitalize">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.status === "online"
                            ? "bg-[#2F7D5B]"
                            : user.status === "away"
                            ? "bg-[#B9822B]"
                            : "bg-[#9B9E9C]"
                        }`}
                      />
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6C716D]">
                    {user.joinedDate || "Jan 2024"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex rounded-lg border border-[#E3E5E1] px-2.5 py-1 text-xs font-semibold text-[#181A19] hover:bg-[#F0F1EE]"
                    >
                      Inspect Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer / Pagination */}
        <div className="flex items-center justify-between border-t border-[#E3E5E1] p-3 text-xs text-[#6C716D]">
          <span>Showing {filtered.length} of {sampleUsers.length} users</span>
          <div className="flex gap-1">
            <button
              disabled
              className="rounded-lg border border-[#E3E5E1] px-2.5 py-1 opacity-50"
            >
              Previous
            </button>
            <button
              disabled
              className="rounded-lg border border-[#E3E5E1] px-2.5 py-1 opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
