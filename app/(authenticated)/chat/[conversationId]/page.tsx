"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MoreHorizontal,
  Video,
  Phone,
} from "lucide-react";
import {
  sampleConversations,
  sampleMessages,
  sampleUsers,
  currentUser,
} from "@/lib/mock-data";
import { Message } from "@/types";
import {
  Avatar,
  MessageBubble,
  MessageComposer,
} from "@/components/common";

export default function PrivateChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = (params?.conversationId as string) || "conv_chelsea";

  // Find conversation participant (defaults to Chelsea Apanta)
  const conv = sampleConversations.find((c) => c.id === conversationId);
  const participant = conv?.participant || sampleUsers[0];

  const initialMsgs =
    sampleMessages[conversationId] ||
    sampleMessages.conv_chelsea ||
    sampleMessages.default ||
    [];

  const [messages, setMessages] = useState<Message[]>(initialMsgs);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }).toLowerCase().replace(" ", ""),
      isOutgoing: true,
      status: "read",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName || participant.name,
            text: replyingTo.content,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyingTo(null);

    // Simulated responsive typing reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now() + 1}`,
            conversationId,
            senderId: participant.id,
            senderName: participant.name,
            content: "Haha completely agree! Can't wait for the next trip! ✨",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }).toLowerCase().replace(" ", ""),
            isOutgoing: false,
            status: "read",
          },
        ]);
      }, 1500);
    }, 800);
  };

  const handleSendVoiceNote = () => {
    const newVoiceMsg: Message = {
      id: `msg_voice_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: "Voice note",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }).toLowerCase().replace(" ", ""),
      isOutgoing: true,
      status: "read",
      audioWaveform: [30, 50, 75, 40, 90, 60, 85, 95, 40, 70, 80, 50, 60, 85, 40, 20, 70, 85, 50, 30],
      audioDuration: "0:09",
    };
    setMessages((prev) => [...prev, newVoiceMsg]);
  };

  const handleSendAttachment = (type: "image" | "file" | "location") => {
    const newMsg: Message = {
      id: `msg_att_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: type === "image" ? "Check out these new snapshots!" : "Shared attachment.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }).toLowerCase().replace(" ", ""),
      isOutgoing: true,
      status: "read",
      photosStack: type === "image" ? ["/images/urban_skyline.jpg", "/images/urban_taxi.jpg"] : undefined,
      photosCount: type === "image" ? 12 : undefined,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* 2026 Ultra-clean Header (Image 1 Left) */}
      <header className="sticky top-0 z-30 flex h-18 w-full flex-shrink-0 items-center justify-between bg-white px-3 border-b border-neutral-100">
        {/* Back Button in soft circle */}
        <Link
          href="/home"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F1F5] text-neutral-800 hover:bg-[#E5E7EB] active:scale-95 transition-all"
          aria-label="Back to messages"
        >
          <ChevronLeft className="h-5 w-5 -translate-x-0.5" strokeWidth={2.2} />
        </Link>

        {/* Center: Profile avatar with green online dot + Centered name */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <Avatar
              name={participant.name}
              avatarUrl={participant.avatarUrl}
              size="sm"
            />
            {/* Green online dot centered at the bottom of avatar */}
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#22C55E] border-2 border-white" />
          </div>
          <span className="mt-1 text-[13px] font-semibold tracking-tight text-neutral-900 leading-none">
            {participant.name}
          </span>
        </div>

        {/* Right Action: Video Call launcher + More Options Button */}
        <div className="flex items-center gap-1.5">
          <Link
            href={`/call/${conversationId}?name=${encodeURIComponent(participant.name)}&type=video`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F1F5] text-neutral-800 hover:bg-[#E5E7EB] active:scale-95 transition-all"
            title="Start Video Call"
            aria-label="Start video call"
          >
            <Video className="h-4.5 w-4.5" strokeWidth={1.8} />
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F1F5] text-neutral-800 hover:bg-[#E5E7EB] active:scale-95 transition-all cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* Messages Scrollable View */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onReply={(m) => setReplyingTo(m)}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 py-2 pl-2">
            <div className="flex items-center gap-1 bg-[#ECEEF2] px-3.5 py-2 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Message Composer (Image 1 Left) */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onSendVoiceNote={handleSendVoiceNote}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendAttachment={handleSendAttachment}
      />
    </div>
  );
}
