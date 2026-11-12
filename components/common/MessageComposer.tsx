"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Send, Mic, Image as ImageIcon, FileText, MapPin, X, Trash2 } from "lucide-react";
import { Message } from "@/types";

interface MessageComposerProps {
  onSendMessage?: (text: string) => void;
  onSendVoiceNote?: () => void;
  onCancelRecording?: () => void;
  onTyping?: (isTyping: boolean) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onSendAttachment?: (type: "image" | "file" | "location") => void;
  isRecording?: boolean;
  recordingDuration?: number;
}

export default function MessageComposer({
  onSendMessage,
  onSendVoiceNote,
  onCancelRecording,
  onTyping,
  replyingTo,
  onCancelReply,
  onSendAttachment,
  isRecording = false,
  recordingDuration = 0,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced typing callback
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (onTyping) {
      if (val.trim().length > 0) {
        onTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          onTyping(false);
        }, 1800);
      } else {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        onTyping(false);
      }
    }
  };

  const handleBlur = () => {
    if (onTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onTyping) onTyping(false);
    if (onSendMessage) {
      onSendMessage(text.trim());
    }
    setText("");
    setShowAttachments(false);
  };

  // Format recording timer: mm:ss
  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  // Clean up typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  return (
    <div className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md px-3 pt-2 pb-4 border-t border-neutral-100 select-none">
      {/* Replying preview banner */}
      {replyingTo && !isRecording && (
        <div className="mb-2 flex items-center justify-between rounded-2xl bg-neutral-100 px-3 py-1.5 text-xs animate-slide-up">
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
              className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              aria-label="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Attachment popup drawer */}
      {showAttachments && !isRecording && (
        <div className="mb-3 p-3 rounded-2xl bg-white border border-neutral-200/80 shadow-lg grid grid-cols-3 gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              onSendAttachment?.("image");
              setShowAttachments(false);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer"
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
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer"
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
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-neutral-700 mb-1" />
            <span className="text-xs font-medium">Location</span>
          </button>
        </div>
      )}

      {/* Recording Mode UI (WhatsApp Style) */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-2 h-11 rounded-full bg-[#1C1C1E] px-4 animate-fade-in text-white shadow-md">
          {/* Left: Blinking red dot + recording timer */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-wider text-rose-400 min-w-[36px]">
              {formatRecordingTime(recordingDuration)}
            </span>
          </div>

          {/* Center: Live animated waveform / pulse */}
          <div className="flex items-center gap-1">
            <span className="h-4 w-1 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="h-6 w-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="h-3 w-1 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            <span className="h-5 w-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "100ms" }} />
            <span className="h-2 w-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "250ms" }} />
            <span className="text-xs text-white/70 ml-2 font-medium">Recording audio...</span>
          </div>

          {/* Right: Trash / Cancel + Send button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelRecording}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-rose-400 hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Cancel recording"
              aria-label="Cancel voice recording"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onSendVoiceNote}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-black hover:bg-[#20ba59] active:scale-90 transition-transform shadow-sm cursor-pointer"
              title="Send voice note"
              aria-label="Send voice note"
            >
              <Send className="h-3.5 w-3.5 fill-black ml-0.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Regular Message Composer */
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
              onChange={handleTextChange}
              onBlur={handleBlur}
              placeholder="Type message"
              className="w-full bg-transparent text-[14px] text-neutral-900 placeholder-[#9B9E9C] focus:outline-none"
            />

            {/* Voice Mic Icon on right inside */}
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
      )}
    </div>
  );
}
