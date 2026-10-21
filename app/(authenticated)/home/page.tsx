"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus, MessageSquarePlus, Search, ChevronDown, Plus } from "lucide-react";
import { sampleConversations, sampleStories } from "@/lib/mock-data";
import { UserRow, BottomNavigation } from "@/components/common";

export default function HomePage() {
  const [search, setSearch] = useState("");

  const filtered = sampleConversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.participant.name.toLowerCase().includes(q) ||
      c.participant.userNumber.includes(q) ||
      c.lastMessage.text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-dvh flex-col bg-[#0C0C0E]">
      {/* Gradient Hero Header */}
      <div
        className="relative overflow-hidden pt-12 pb-6 px-4 rounded-b-[10%]"
        style={{ background: 'linear-gradient(155deg, #5B8FA8 0%, #7B8FC4 38%, #9B7DB8 70%, #8B6CAA 100%)' }}
      >
        {/* Search Bar */}
        <div className="relative z-10 flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2.5 h-10 rounded-full bg-black/25 backdrop-blur-sm px-4 border border-white/15">
            <Search className="h-3.5 w-3.5 text-white/60 flex-shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-[13px] text-white placeholder-white/55 focus:outline-none"
            />
          </div>
          <button type="button" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm border border-white/15 text-white hover:bg-black/40 active:scale-95 transition-all cursor-pointer" aria-label="Filter">
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Hero Heading */}
        <div className="relative z-10 mb-6">
          <h1 className="text-[32px] text-white leading-tight tracking-tight drop-shadow-sm">
            Let&apos;s Stay<br />Connected
          </h1>
        </div>

        {/* Story Ring Row */}
        <div className="relative z-10 flex items-center gap-4 overflow-x-auto pb-1">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button type="button" className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/20 border-2 border-dashed border-white/50 text-white hover:bg-white/30 active:scale-95 transition-all cursor-pointer" aria-label="Add story">
              <Plus className="h-6 w-6" strokeWidth={2.2} />
            </button>
            <span className="text-[11px] text-white/75 font-medium">Add</span>
          </div>
          {sampleStories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={story.unread ? 'h-[58px] w-[58px] rounded-full p-[2.5px] bg-gradient-to-br from-white via-white/70 to-white/30 shadow-md' : 'h-[58px] w-[58px] rounded-full p-[2.5px] bg-white/30'}>
                <div className="h-full w-full rounded-full overflow-hidden bg-neutral-400">
                  <img src={story.avatarUrl} alt={story.name} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                </div>
              </div>
              <span className="text-[11px] text-white/75 font-medium">{story.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dark Conversation Feed */}
      <main className="flex-1 overflow-y-auto bg-[#0C0C0E]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <MessageSquarePlus className="w-6 h-6 text-white/50" />
            </div>
            <p className="text-white text-base font-semibold mb-1">No conversations</p>
            <p className="text-neutral-500 text-sm">
              {search ? `No results for "${search}"` : "Start by connecting with someone."}
            </p>
            <Link href="/connect" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-neutral-200 transition-colors">
              <UserPlus className="w-4 h-4" />
              Connect
            </Link>
          </div>
        ) : (
          <div>
            {filtered.map((conv) => (
              <UserRow
                key={conv.id}
                href={`/chat/${conv.id}`}
                name={conv.participant.name}
                userNumber={conv.participant.userNumber}
                avatarUrl={conv.participant.avatarUrl}
                status={conv.participant.status}
                subtitle={conv.lastMessage.text}
                timestamp={conv.lastMessage.timestamp}
                unreadCount={conv.unreadCount}
                isPinned={conv.isPinned}
                isMuted={conv.isMuted}
                isOutgoing={conv.lastMessage.isOutgoing}
                messageStatus={conv.lastMessage.status}
                hasPhotoMedia={conv.lastMessage.hasPhotoMedia}
                theme="dark"
              />
            ))}
          </div>
        )}
      </main>

      <BottomNavigation theme="dark" />
    </div>
  );
}
