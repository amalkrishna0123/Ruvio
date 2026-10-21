"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneCall,
  Search,
} from "lucide-react";
import { sampleCalls, sampleUsers } from "@/lib/mock-data";
import {
  Avatar,
  SearchBar,
  EmptyState,
  BottomNavigation,
} from "@/components/common";

export default function CallsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "missed">("all");

  const filtered = sampleCalls.filter((c) => {
    const matches =
      c.participant.name.toLowerCase().includes(search.toLowerCase()) ||
      c.participant.userNumber.includes(search);
    if (!matches) return false;
    if (filter === "missed") return c.direction === "missed";
    return true;
  });

  const getDirectionIcon = (dir: "incoming" | "outgoing" | "missed") => {
    switch (dir) {
      case "missed":
        return <PhoneMissed className="h-3.5 w-3.5 text-[#B94A48]" />;
      case "outgoing":
        return <PhoneOutgoing className="h-3.5 w-3.5 text-[#1F5C4A]" />;
      case "incoming":
        return <PhoneIncoming className="h-3.5 w-3.5 text-[#2F7D5B]" />;
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Call Log
          </h1>
          <span className="text-[11px] text-[#6C716D]">
            End-to-end encrypted relay calls
          </span>
        </div>

        <Link
          href={`/call/direct-audio?name=${encodeURIComponent(sampleUsers[0].name)}`}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1F5C4A] px-3 text-xs font-semibold text-white hover:bg-[#164638] transition-colors shadow-xs"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>New Call</span>
        </Link>
      </header>

      {/* Search and Filters */}
      <div className="p-3 border-b border-[#E3E5E1]/60 bg-[#FAFAF8] space-y-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search call logs..."
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-[#1F5C4A] text-white"
                : "bg-white text-[#6C716D] border border-[#E3E5E1]"
            }`}
          >
            All Calls
          </button>
          <button
            type="button"
            onClick={() => setFilter("missed")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === "missed"
                ? "bg-[#B94A48] text-white"
                : "bg-white text-[#6C716D] border border-[#E3E5E1]"
            }`}
          >
            Missed Only
          </button>
        </div>
      </div>

      {/* Call list */}
      <main className="flex-1 divide-y divide-[#E3E5E1]/50 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<PhoneCall className="w-6 h-6 text-[#1F5C4A]" />}
            title="No call history"
            description="Your recent encrypted audio and video calls will show here."
          />
        ) : (
          filtered.map((call) => {
            const isMissed = call.direction === "missed";
            return (
              <div
                key={call.id}
                className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={call.participant.name}
                    userNumber={call.participant.userNumber}
                    status={call.participant.status}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isMissed ? "text-[#B94A48]" : "text-[#181A19]"
                      }`}
                    >
                      {call.participant.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#6C716D] mt-0.5">
                      {getDirectionIcon(call.direction)}
                      <span>{call.timestamp}</span>
                      {call.duration && (
                        <>
                          <span>·</span>
                          <span>{call.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/call/${call.id}?type=${call.type}&name=${encodeURIComponent(call.participant.name)}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F5C4A] hover:bg-[#E8F2EE] transition-colors"
                    title={`Call back (${call.type})`}
                  >
                    {call.type === "video" ? (
                      <Video className="w-4.5 h-4.5" />
                    ) : (
                      <Phone className="w-4.5 h-4.5" />
                    )}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
