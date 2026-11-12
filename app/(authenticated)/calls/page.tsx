"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneCall,
  Users,
} from "lucide-react";
import {
  Avatar,
  SearchBar,
  EmptyState,
  BottomNavigation,
} from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeCallHistory } from "@/lib/firebase/calls-service";
import { subscribeUserConnections } from "@/lib/firebase/connections-service";
import { CallRecord, User } from "@/types";
import Link from "next/link";

export default function CallsPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [showNewCall, setShowNewCall] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) {
      setIsLoading(false);
      return;
    }

    const unsubCalls = subscribeCallHistory(userProfile.id, (realCalls) => {
      setCalls(realCalls);
      setIsLoading(false);
    });

    const unsubConns = subscribeUserConnections(userProfile.id, (conns) => {
      setConnections(conns);
    });

    return () => {
      unsubCalls();
      unsubConns();
    };
  }, [userProfile?.id]);

  const filtered = calls.filter((c) => {
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

  const initiateCall = (contact: User, type: "audio" | "video") => {
    if (!userProfile) return;
    // callId = sorted IDs joined, so both sides agree on the same callId
    const callId = [userProfile.id, contact.id].sort().join("_") + `_${Date.now()}`;
    router.push(
      `/call/${callId}?name=${encodeURIComponent(contact.name)}&type=${type}&recipientId=${contact.id}`
    );
    setShowNewCall(false);
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

        <button
          type="button"
          onClick={() => setShowNewCall((prev) => !prev)}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1F5C4A] px-3 text-xs font-semibold text-white hover:bg-[#164638] transition-colors shadow-xs cursor-pointer"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>New Call</span>
        </button>
      </header>

      {/* New Call — Connections Sheet */}
      {showNewCall && (
        <div className="bg-[#FAFAF8] border-b border-[#E3E5E1] p-3 animate-fade-in">
          <p className="text-xs font-semibold text-[#181A19] mb-2">Call a connection</p>
          {connections.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center text-xs text-[#6C716D]">
              <Users className="w-6 h-6 mb-2 text-[#1F5C4A]" />
              <span>No connections yet.</span>
              <Link
                href="/connect"
                className="mt-1.5 text-[#1F5C4A] font-semibold underline"
              >
                Add a connection
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E3E5E1]/50">
              {connections.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={contact.name}
                      userNumber={contact.userNumber}
                      avatarUrl={contact.avatarUrl}
                      status={contact.status}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#181A19]">{contact.name}</p>
                      <p className="text-[11px] text-[#6C716D]">#{contact.userNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Audio call */}
                    <button
                      type="button"
                      onClick={() => initiateCall(contact, "audio")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F5C4A] hover:bg-[#E8F2EE] transition-colors cursor-pointer"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    {/* Video call */}
                    <button
                      type="button"
                      onClick={() => initiateCall(contact, "video")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F5C4A] hover:bg-[#E8F2EE] transition-colors cursor-pointer"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-[#6C716D]">
            Loading call logs...
          </div>
        ) : filtered.length === 0 ? (
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
                    avatarUrl={call.participant.avatarUrl}
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
                  <button
                    type="button"
                    onClick={() => initiateCall(call.participant, call.type)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F5C4A] hover:bg-[#E8F2EE] transition-colors cursor-pointer"
                    title={`Call back (${call.type})`}
                  >
                    {call.type === "video" ? (
                      <Video className="w-4.5 h-4.5" />
                    ) : (
                      <Phone className="w-4.5 h-4.5" />
                    )}
                  </button>
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
