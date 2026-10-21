"use client";

import React, { useState, useRef } from "react";
import { Plus, Send, Mic, Image as ImageIcon, FileText, MapPin, X } from "lucide-react";
import { Message } from "@/types";

interface MessageComposerProps {
  onSendMessage?: (text: string) => void;
  onSendVoiceNote?: () => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onSendAttachment?: (type: "image" | "file" | "location") => void;
}

export default function MessageComposer({
  onSendMessage,
  onSendVoiceNote,
  replyingTo,
  onCancelReply,
  onSendAttachment,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (onSendMessage) {
      onSendMessage(text.trim());
    }
    setText("");
    setShowAttachments(false);
  };

  return (
    <div className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md px-3 pt-2 pb-4 border-t border-neutral-100">
      {/* Replying preview banner */}
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-2xl bg-neutral-100 px-3 py-1.5 text-xs">
          <div className="border-l-2 border-black pl-2 min-w-0">
            <span className="font-semibold text-neutral-900 block">
              Replying to {replyingTo.senderName || "message"}
            </span>
            <span className="truncate block text-neutral-500">{replyingTo.content}</span>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 text-neutral-400 hover:text-neutral-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Attachment popup drawer */}
      {showAttachments && (
        <div className="mb-3 p-3 rounded-2xl bg-white border border-neutral-200/80 shadow-lg grid grid-cols-3 gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              onSendAttachment?.("image");
              setShowAttachments(false);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-neutral-700 mb-1" />
            <span className="text-xs font-medium">Photos</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSendAttachment?.("file");
              setShowAttachments(false);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-colors"
          >
            <FileText className="w-5 h-5 text-neutral-700 mb-1" />
            <span className="text-xs font-medium">Document</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSendAttachment?.("location");
              setShowAttachments(false);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-colors"
          >
            <MapPin className="w-5 h-5 text-neutral-700 mb-1" />
            <span className="text-xs font-medium">Location</span>
          </button>
        </div>
      )}

      {/* Floating 2026 Pill Composer Bar (Image 1 Left) */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Round Plus Button */}
        <button
          type="button"
          onClick={() => setShowAttachments((prev) => !prev)}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
            showAttachments
              ? "bg-black text-white"
              : "bg-[#F0F1F5] text-neutral-700 hover:bg-[#E5E7EB] active:scale-95"
          }`}
          aria-label="Add attachment"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Input capsule container */}
        <div className="relative flex-1 flex items-center h-11 rounded-full bg-[#F0F1F5] px-4">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message"
            className="w-full bg-transparent text-[14px] text-neutral-900 placeholder-[#9B9E9C] focus:outline-none"
          />

          {/* Voice Mic Icon on right inside or beside */}
          <button
            type="button"
            onClick={onSendVoiceNote}
            className="ml-2 flex-shrink-0 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Record Voice Note"
            aria-label="Record voice note"
          >
            <Mic className="h-4.5 w-4.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Black circular send button with white paper airplane / send icon */}
        <button
          type="submit"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#18181A] text-white hover:bg-black transition-transform active:scale-95 shadow-sm cursor-pointer"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
