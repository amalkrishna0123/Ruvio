"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Video,
} from "lucide-react";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Message, Project } from "@/types";
import { MessageBubble, MessageComposer } from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "";
  const { userProfile } = useAuth();

  const [project, setProject] = useState<Project>({
    id: projectId,
    name: "Workspace Chat",
    description: "",
    status: "active",
    owner: {
      id: "",
      name: "Owner",
      userNumber: "",
      email: "",
      status: "online",
    },
    memberCount: 1,
    members: [],
    lastActivity: "Recently",
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [fileCount, setFileCount] = useState<number>(0);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 1. Fetch genuine project record
  useEffect(() => {
    if (!projectId) return;

    getDoc(doc(db, "projects", projectId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProject({
          id: snap.id,
          name: d.name || "Workspace Chat",
          description: d.description || "",
          status: d.status || "active",
          owner: d.owner,
          memberCount: d.members?.length || 1,
          members: d.members || [],
          lastActivity: d.lastActivity || "Recently",
        });
      }
    });

    // Count files
    const unsubFiles = onSnapshot(collection(db, "projects", projectId, "files"), (snap) => {
      setFileCount(snap.size);
    });

    return () => unsubFiles();
  }, [projectId]);

  // 2. Subscribe to genuine project messages
  useEffect(() => {
    if (!projectId) return;

    const msgsRef = collection(db, "projects", projectId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            conversationId: projectId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            content: data.content || "",
            timestamp: data.timestamp || "Just now",
            isOutgoing: data.senderId === userProfile?.id,
            status: data.status || "delivered",
            replyTo: data.replyTo,
          });
        });
        setMessages(list);
      },
      (err) => {
        console.warn("Project messages error:", err);
      }
    );

    return () => unsubscribe();
  }, [projectId, userProfile?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!userProfile || !projectId) return;

    const now = new Date();
    const timeStr = now
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      .toLowerCase();

    const msgsRef = collection(db, "projects", projectId, "messages");
    await addDoc(msgsRef, {
      conversationId: projectId,
      senderId: userProfile.id,
      senderName: userProfile.name,
      senderAvatar: userProfile.avatarUrl || "",
      content: text,
      timestamp: timeStr,
      status: "delivered",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName || "Member",
            text: replyingTo.content,
          }
        : null,
      createdAt: serverTimestamp(),
    });

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
          <span>{project.memberCount} members</span>
        </div>
        <Link
          href={`/projects/${project.id}/files`}
          className="text-[#1F5C4A] font-medium hover:underline"
        >
          View Files ({fileCount})
        </Link>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 text-xs text-[#6C716D]">
            <p>Welcome to {project.name} workspace channel.</p>
            <p className="mt-1">Messages posted here are visible to all workspace members.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              showSenderName={true}
              onReply={(m) => setReplyingTo(m)}
            />
          ))
        )}
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
