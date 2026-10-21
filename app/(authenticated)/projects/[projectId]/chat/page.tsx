"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Video,
  Users,
  FolderGit2,
  Lock,
} from "lucide-react";
import { sampleProjects, sampleUsers, currentUser } from "@/lib/mock-data";
import { Message } from "@/types";
import { MessageBubble, MessageComposer, Avatar } from "@/components/common";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "prj_mesh_protocol";
  const project =
    sampleProjects.find((p) => p.id === projectId) || sampleProjects[0];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "p_msg_1",
      conversationId: projectId,
      senderId: sampleUsers[0].id,
      senderName: sampleUsers[0].name,
      content: "Team, the test results on the decentralized mesh relay are published in the files tab.",
      timestamp: "09:30 AM",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "p_msg_2",
      conversationId: projectId,
      senderId: sampleUsers[1].id,
      senderName: sampleUsers[1].name,
      content: "Reviewing now. Latency overhead is under 4%, which passes our target benchmark.",
      timestamp: "09:44 AM",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "p_msg_3",
      conversationId: projectId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: "Excellent. I will push the signed binaries to the repository this afternoon.",
      timestamp: "10:02 AM",
      isOutgoing: true,
      status: "read",
    },
  ]);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const newMsg: Message = {
      id: `p_msg_${Date.now()}`,
      conversationId: projectId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOutgoing: true,
      status: "delivered",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName || "Member",
            text: replyingTo.content,
          }
        : undefined,
    };
    setMessages((prev) => [...prev, newMsg]);
    setReplyingTo(null);
  };

  return (
    <div className="flex h-dvh flex-col bg-[#F5F5F2]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 w-full flex-shrink-0 items-center justify-between border-b border-[#E3E5E1] bg-white px-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-all"
            aria-label="Back to project overview"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>

          <Link
            href={`/projects/${project.id}/members`}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F2EE] text-[#1F5C4A] font-bold text-xs border border-[#1F5C4A]/10">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="truncate text-sm font-semibold text-[#181A19]">
                {project.name}
              </span>
              <span className="text-[11px] text-[#6C716D]">
                {project.memberCount} members · Workspace
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/call/project-${project.id}?type=audio&name=${encodeURIComponent(project.name)}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6C716D] hover:bg-[#F0F1EE] transition-colors"
            aria-label="Team audio call"
          >
            <Phone className="h-4.5 w-4.5" />
          </Link>
          <Link
            href={`/call/project-${project.id}?type=video&name=${encodeURIComponent(project.name)}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6C716D] hover:bg-[#F0F1EE] transition-colors"
            aria-label="Team video call"
          >
            <Video className="h-4.5 w-4.5" />
          </Link>
        </div>
      </header>

      {/* Member presence ribbon */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#FAFAF8] border-b border-[#E3E5E1] text-[11px] text-[#6C716D]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#2F7D5B]" />
          <span>4 members online</span>
        </div>
        <Link
          href={`/projects/${project.id}/files`}
          className="text-[#1F5C4A] font-medium hover:underline"
        >
          View Files (4)
        </Link>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            showSenderName={true}
            onReply={(m) => setReplyingTo(m)}
          />
        ))}
        <div ref={endRef} />
      </main>

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
