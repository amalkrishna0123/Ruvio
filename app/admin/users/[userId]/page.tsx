"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Key,
  FolderGit2,
  Users,
  Ban,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { sampleUsers, sampleProjects } from "@/lib/mock-data";
import { Avatar, PrimaryButton, SecondaryButton } from "@/components/common";

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params?.userId as string) || "usr_elena";

  const user = sampleUsers.find((u) => u.id === userId) || sampleUsers[0];
  const userProjects = sampleProjects.filter((p) =>
    p.members.some((m) => m.id === user.id)
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/users"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-white active:scale-95 transition-colors border border-transparent hover:border-[#E3E5E1]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
            Account Inspection: {user.name}
          </h1>
          <p className="text-xs text-[#6C716D]">
            Identifier #{user.userNumber} · SignalCore Node
          </p>
        </div>
      </div>

      {/* Main Profile Overview Card */}
      <div className="rounded-2xl border border-[#E3E5E1] bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" status={user.status} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#181A19]">{user.name}</h2>
                <span className="font-mono text-xs font-semibold text-[#1F5C4A] bg-[#E8F2EE] px-2 py-0.5 rounded">
                  #{user.userNumber}
                </span>
              </div>
              <p className="text-xs text-[#6C716D] mt-0.5">{user.email}</p>
              <p className="text-[11px] text-[#9B9E9C] mt-0.5">
                Member since {user.joinedDate || "Jan 2024"} · Role: Contributor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert("Rotating session credentials")}
              className="flex items-center gap-1.5 rounded-xl border border-[#E3E5E1] px-3 py-1.5 text-xs font-semibold text-[#181A19] hover:bg-[#F0F1EE]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Rotate Keys</span>
            </button>
            <button
              type="button"
              onClick={() => alert("Account suspended")}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-[#B94A48] hover:bg-[#FBEAEA]"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Suspend</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Node metadata */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#E3E5E1]/60 pt-4 text-xs">
          <div className="rounded-xl bg-[#FAFAF8] p-3 border border-[#E3E5E1]">
            <span className="text-[#6C716D] block text-[11px]">Enclave Status</span>
            <span className="font-semibold text-[#2F7D5B] mt-0.5 block">
              Verified & Synchronized
            </span>
          </div>
          <div className="rounded-xl bg-[#FAFAF8] p-3 border border-[#E3E5E1]">
            <span className="text-[#6C716D] block text-[11px]">Relay Protocol</span>
            <span className="font-semibold text-[#181A19] mt-0.5 block">
              Double-Ratchet (Zurich)
            </span>
          </div>
          <div className="rounded-xl bg-[#FAFAF8] p-3 border border-[#E3E5E1]">
            <span className="text-[#6C716D] block text-[11px]">Associated Workspaces</span>
            <span className="font-semibold text-[#181A19] mt-0.5 block">
              {userProjects.length} Active Workspaces
            </span>
          </div>
        </div>
      </div>

      {/* Projects Membership list */}
      <div className="rounded-2xl border border-[#E3E5E1] bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-[#181A19] mb-3 flex items-center gap-2">
          <FolderGit2 className="h-4 w-4 text-[#1F5C4A]" />
          <span>Assigned Workspaces</span>
        </h3>

        <div className="divide-y divide-[#E3E5E1]/50 text-xs">
          {userProjects.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5">
              <div>
                <span className="font-semibold text-[#181A19]">{p.name}</span>
                <span className="block text-[11px] text-[#6C716D]">{p.description}</span>
              </div>
              <span className="rounded bg-[#E8F2EE] px-2 py-0.5 text-[10px] font-semibold text-[#1F5C4A] uppercase">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
