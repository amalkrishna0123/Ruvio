"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, MessageSquare, Trash2, Users } from "lucide-react";
import { sampleUsers } from "@/lib/mock-data";
import { User } from "@/types";
import {
  Avatar,
  SearchBar,
  EmptyState,
  BottomNavigation,
} from "@/components/common";

export default function ConnectionsPage() {
  const [search, setSearch] = useState("");
  const [connections, setConnections] = useState<User[]>(sampleUsers);

  const filtered = connections.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.userNumber.includes(search) ||
      (u.bio && u.bio.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRemove = (id: string, name: string) => {
    if (confirm(`Remove connection with ${name}? Encrypted session keys will be cleared.`)) {
      setConnections((prev) => prev.filter((u) => u.id !== id));
    }
  };

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
              Connections
            </h1>
            <span className="text-[11px] text-[#6C716D]">
              {connections.length} verified contacts
            </span>
          </div>
        </div>

        <Link
          href="/connect"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F2EE] text-[#1F5C4A] hover:bg-[#D5E8DF] transition-colors"
          aria-label="Connect user"
        >
          <UserPlus className="h-4.5 w-4.5" />
        </Link>
      </header>

      {/* Search Input */}
      <div className="p-3 border-b border-[#E3E5E1]/60 bg-[#FAFAF8]">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Filter connections by name or #ID..."
        />
      </div>

      {/* Connection List */}
      <main className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-[#1F5C4A]" />}
            title="No connections found"
            description={
              search
                ? `No contact matches "${search}".`
                : "You haven't added any contacts to your network yet."
            }
            action={
              <Link
                href="/connect"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#164638]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Connection
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[#E3E5E1]/50">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={user.name}
                    userNumber={user.userNumber}
                    status={user.status}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#181A19] truncate">
                        {user.name}
                      </span>
                      <span className="rounded bg-[#F0F1EE] px-1 py-0.2 text-[10px] font-mono text-[#6C716D]">
                        #{user.userNumber}
                      </span>
                    </div>
                    <p className="text-xs text-[#6C716D] truncate mt-0.5 max-w-[200px]">
                      {user.bio || user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/chat/conv_${user.id.replace("usr_", "")}`}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[#E8F2EE] text-[#1F5C4A] hover:bg-[#D5E8DF] transition-colors"
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(user.id, user.name)}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-[#9B9E9C] hover:text-[#B94A48] hover:bg-[#FBEAEA] transition-colors"
                    title="Remove Connection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
