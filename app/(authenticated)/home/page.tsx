"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, MessageSquarePlus, Search, ChevronDown, Plus } from "lucide-react";
import { UserRow, BottomNavigation } from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeConversations } from "@/lib/firebase/messaging-service";
import { ref as rtdbRef, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase/config";
import { Conversation } from "@/types";

export default function HomePage() {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, { state?: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");

  // 1. Subscribe to genuine conversations
  useEffect(() => {
    if (!userProfile?.id) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeConversations(userProfile.id, (realConvs) => {
      setConversations(realConvs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.id]);

  // 2. Subscribe to Realtime Database presence for genuine online status
  useEffect(() => {
    const presenceRef = rtdbRef(rtdb, "presence");
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const val = snapshot.val() || {};
      setPresenceMap(val);
    });

    return () => unsubscribe();
  }, []);

  const filtered = conversations.filter((c) => {
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

        {/* Story Ring Row - Authentic Status Bar */}
        <div className="relative z-10 flex items-center gap-4 overflow-x-auto pb-1">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Link
              href="/connect"
              className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/20 border-2 border-dashed border-white/50 text-white hover:bg-white/30 active:scale-95 transition-all cursor-pointer"
              aria-label="Add connection"
            >
              <Plus className="h-6 w-6" strokeWidth={2.2} />
            </Link>
            <span className="text-[11px] text-white/75 font-medium">Add</span>
          </div>

          {/* Genuine active conversation participant rings */}
          {conversations.slice(0, 5).map((conv) => {
            const isOnline = presenceMap[conv.participant.id]?.state === "online";
            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className={`relative h-[58px] w-[58px] rounded-full p-[2.5px] transition-all ${
                    isOnline
                      ? "bg-gradient-to-br from-[#22C55E] via-[#22C55E]/80 to-[#22C55E]/40 shadow-md"
                      : "bg-gradient-to-br from-white/30 via-white/15 to-white/5"
                  }`}
                >
                  <div className="h-full w-full rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-white text-xs font-semibold">
                    {conv.participant.avatarUrl ? (
                      <img
                        src={conv.participant.avatarUrl}
                        alt={conv.participant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      conv.participant.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  {/* Green dot on story circle only when user is online */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#22C55E] border-2 border-[#0C0C0E]" />
                  )}
                </div>
                <span className="text-[11px] text-white/75 font-medium truncate max-w-[60px]">
                  {conv.participant.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dark Conversation Feed */}
      <main className="flex-1 overflow-y-auto bg-[#0C0C0E]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-white/40 text-xs">
            Loading conversations...
          </div>
        ) : filtered.length === 0 ? (
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
            {filtered.map((conv) => {
              const isOnline = presenceMap[conv.participant.id]?.state === "online";
              return (
                <UserRow
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  name={conv.participant.name}
                  userNumber={conv.participant.userNumber}
                  avatarUrl={conv.participant.avatarUrl}
                  status={isOnline ? "online" : "offline"}
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
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation theme="dark" />
    </div>
  );
}
