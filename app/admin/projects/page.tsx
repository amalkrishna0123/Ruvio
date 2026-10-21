"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderGit2, Search, Plus, ExternalLink } from "lucide-react";
import { sampleProjects } from "@/lib/mock-data";

export default function AdminProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = sampleProjects.filter((p) => {
    const matches =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.name.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
            Workspaces Directory
          </h1>
          <p className="text-xs text-[#6C716D]">
            Global audit of all encrypted collaboration workspaces
          </p>
        </div>

        <Link
          href="/projects/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#164638] transition-colors shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Workspace</span>
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
            placeholder="Search workspaces by name or owner..."
            className="h-10 w-full rounded-xl bg-white pl-9.5 pr-4 text-xs text-[#181A19] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl bg-white px-3 text-xs text-[#181A19] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E3E5E1] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E5E1] bg-[#FAFAF8] text-[11px] font-semibold uppercase tracking-wider text-[#6C716D]">
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Contributors</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E5E1]/60 text-xs">
              {filtered.map((proj) => (
                <tr key={proj.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-[#181A19]">
                        {proj.name}
                      </div>
                      <div className="text-[11px] text-[#6C716D] max-w-xs truncate">
                        {proj.description}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#181A19] font-medium">
                    {proj.owner.name}
                  </td>
                  <td className="py-3 px-4 text-[#6C716D]">
                    {proj.memberCount} members
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-[#E8F2EE] px-2 py-0.5 text-[10px] font-semibold text-[#1F5C4A] uppercase">
                      {proj.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E3E5E1] px-2.5 py-1 text-xs font-semibold text-[#181A19] hover:bg-[#F0F1EE]"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#E3E5E1] p-3 text-xs text-[#6C716D]">
          Showing {filtered.length} workspaces
        </div>
      </div>
    </div>
  );
}
