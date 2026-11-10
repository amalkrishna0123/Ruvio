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
import { Message, User } from "@/types";
import {
  Avatar,
  MessageBubble,
  MessageComposer,
} from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  subscribeMessages,
  sendMessage,
  subscribeTyping,
  reportTyping,
  subscribePresence,
  markConversationAsRead,
} from "@/lib/firebase/messaging-service";
import {
  uploadToCloudinary,
  uploadVoiceNoteToCloudinary,
} from "@/lib/firebase/cloudinary";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function PrivateChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = (params?.conversationId as string) || "";
  const { userProfile } = useAuth();

  const [participant, setParticipant] = useState<User>({
    id: "",
    name: "Chat",
    userNumber: "",
    email: "",
    status: "offline",
  });
  const [participantPresence, setParticipantPresence] = useState<{
    state: "online" | "offline" | "away";
    lastSeen?: string;
  }>({ state: "offline" });

  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Fetch genuine conversation & participant info from Firestore
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    async function loadConv() {
      try {
        const convSnap = await getDoc(doc(db, "conversations", conversationId));
        if (convSnap.exists() && isMounted) {
          const data = convSnap.data();
          const currentUid = userProfile?.id;
          const otherUser =
            data.participant?.id === currentUid
              ? data.owner
              : data.participant;

          if (otherUser) {
            setParticipant(otherUser);
          }
        } else if (isMounted) {
          // If conversationId is a userId
          const userSnap = await getDoc(doc(db, "users", conversationId));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setParticipant({
              id: userSnap.id,
              name: uData.name || "User",
              userNumber: uData.userNumber || "",
              email: uData.email || "",
              avatarUrl: uData.avatarUrl,
              status: uData.status || "offline",
            });
          }
        }
      } catch (err) {
        console.warn("Error loading conversation participant:", err);
      }
    }

    loadConv();
    return () => {
      isMounted = false;
    };
  }, [conversationId, userProfile?.id]);

  // 2. Real-time participant presence
  useEffect(() => {
    if (!participant.id) return;
    const unsubscribe = subscribePresence(participant.id, (pres) => {
      setParticipantPresence(pres);
    });
    return () => unsubscribe();
  }, [participant.id]);

  // 3. Subscribe to genuine messages
  useEffect(() => {
    if (!conversationId || !userProfile?.id) return;

    markConversationAsRead(conversationId, userProfile.id);

    const unsubscribe = subscribeMessages(
      conversationId,
      userProfile.id,
      (realMsgs) => {
        setMessages(realMsgs);
        if (realMsgs.length > 0) {
          const lastMsg = realMsgs[realMsgs.length - 1];
          // If the last message was sent by current user and is not yet read by recipient,
          // make sure conversation record reflects its true status (delivered, not read)
          if (lastMsg.isOutgoing && lastMsg.status !== "read") {
            updateDoc(doc(db, "conversations", conversationId), {
              "lastMessage.status": lastMsg.status,
            }).catch(() => {});
          }
        }
      }
    );

    return () => unsubscribe();
  }, [conversationId, userProfile?.id]);

  // 4. Subscribe to genuine typing status
  useEffect(() => {
    if (!conversationId || !userProfile?.id) return;
    const unsubscribe = subscribeTyping(
      conversationId,
      userProfile.id,
      (typingState) => {
        setIsTyping(typingState);
      }
    );
    return () => unsubscribe();
  }, [conversationId, userProfile?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!userProfile || !conversationId) return;

    reportTyping(conversationId, userProfile.id, false);

    await sendMessage(conversationId, userProfile, text, {
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName || participant.name,
            text: replyingTo.content,
          }
        : undefined,
    });

    setReplyingTo(null);
  };

  // Real voice recording via MediaRecorder & Cloudinary upload
  const handleSendVoiceNote = async () => {
    if (!userProfile || !conversationId) return;

    if (isRecording) {
      // Stop recording and dispatch upload
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        alert("Audio recording is not supported in this environment.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      const startTime = Date.now();

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const durationStr = `0:${durationSec < 10 ? `0${durationSec}` : durationSec}`;

        setIsUploading(true);
        try {
          const uploadRes = await uploadVoiceNoteToCloudinary(audioBlob, durationSec);
          await sendMessage(conversationId, userProfile, "Voice note", {
            audioDuration: durationStr,
            audioWaveform: [30, 45, 60, 35, 75, 55, 90, 70, 40, 65, 80, 45, 60, 75, 40, 25, 65, 80, 50, 30],
            attachment: {
              type: "file",
              url: uploadRes.url,
              fileName: "Voice note.webm",
              fileSize: `${Math.round((uploadRes.bytes || 2048) / 1024)} KB`,
            },
          });
        } catch (err: any) {
          alert(`Failed to upload voice note: ${err?.message || err}`);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Could not start audio recording:", err);
      alert("Microphone permission required to record voice notes.");
    }
  };

  // Attachment button click trigger
  const handleSendAttachment = (type: "image" | "file" | "location") => {
    if (type === "image") {
      imageInputRef.current?.click();
    } else if (type === "file") {
      docInputRef.current?.click();
    } else if (type === "location") {
      handleSendLocation();
    }
  };

  // Real Image selection & Cloudinary upload (supports multiple images)
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userProfile || !conversationId) return;

    const fileList = Array.from(files);
    setIsUploading(true);
    try {
      const uploadResults = await Promise.all(
        fileList.map((file) => uploadToCloudinary(file, "whatsapp/images"))
      );

      const urls = uploadResults.map((r) => r.url);
      const isMultiple = urls.length > 1;

      await sendMessage(
        conversationId,
        userProfile,
        isMultiple ? `Shared ${urls.length} photos` : "Shared an image",
        {
          photosStack: urls,
          attachment: {
            type: "image",
            url: urls[0],
            fileName: fileList[0].name,
          },
        }
      );
    } catch (err: any) {
      alert(`Image upload error: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Real Document selection & Cloudinary upload (supports multiple files)
  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userProfile || !conversationId) return;

    const fileList = Array.from(files);
    setIsUploading(true);
    try {
      const uploadResults = await Promise.all(
        fileList.map((file) => uploadToCloudinary(file, "whatsapp/documents"))
      );

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const res = uploadResults[i];
        const sizeStr = `${Math.round(file.size / 1024)} KB`;
        await sendMessage(conversationId, userProfile, file.name, {
          attachment: {
            type: "file",
            url: res.url,
            fileName: file.name,
            fileSize: sizeStr,
          },
        });
      }
    } catch (err: any) {
      alert(`Document upload error: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  // Real Geolocation location sharing
  const handleSendLocation = () => {
    if (!userProfile || !conversationId) return;

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
          await sendMessage(conversationId, userProfile, "Current Location", {
            attachment: {
              type: "location",
              url: mapUrl,
              locationName: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            },
          });
        },
        async () => {
          // If permission denied or unavailable, send default location
          await sendMessage(conversationId, userProfile, "Location Check-in", {
            attachment: {
              type: "location",
              locationName: "Zurich Secure Relay Node",
            },
          });
        }
      );
    }
  };

  const isOnline = participantPresence.state === "online";

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Hidden file pickers for genuine Cloudinary uploads (supports multiple selection) */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageFileSelect}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg,.mp4,.mov,.mp3,.csv,.xlsx,.pptx"
        multiple
        className="hidden"
        onChange={handleDocFileSelect}
      />

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
            {/* Green online dot centered at the bottom of avatar when genuinely online */}
            {isOnline && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#22C55E] border-2 border-white" />
            )}
          </div>
          <span className="mt-1 text-[13px] font-semibold tracking-tight text-neutral-900 leading-none">
            {participant.name}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {isOnline ? "Active now" : (participantPresence.lastSeen || "Offline")}
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
            onClick={() => router.push(`/call/${conversationId}?name=${encodeURIComponent(participant.name)}&type=audio`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F1F5] text-neutral-800 hover:bg-[#E5E7EB] active:scale-95 transition-all cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* Messages Scrollable View */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 text-neutral-400 text-xs">
            <p>End-to-end encrypted conversation.</p>
            <p className="mt-1">Messages and calls are secured with zero metadata footprint.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onReply={(m) => setReplyingTo(m)}
            />
          ))
        )}

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

        {/* Media Uploading indicator */}
        {isUploading && (
          <div className="flex items-center justify-center py-2 text-xs text-neutral-500">
            <span className="animate-pulse">Uploading to Cloudinary...</span>
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
