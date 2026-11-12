"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Message } from "@/types";
import { Play, Pause, Check, CheckCheck, X, ChevronLeft, ChevronRight, Mic } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  showSenderName?: boolean;
  onReply?: (msg: Message) => void;
  onPreviewPhotos?: (photos: string[]) => void;
}

// ─── Image Slide Lightbox ────────────────────────────────────────────────────
function ImageLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : photos.length - 1)), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i < photos.length - 1 ? i + 1 : 0)), [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 z-10 cursor-pointer"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium bg-black/40 px-3 py-1 rounded-full z-10">
        {index + 1} / {photos.length}
      </div>

      <div
        className="relative w-full max-w-lg flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {photos.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <img
          key={index}
          src={photos[index]}
          alt={`Photo ${index + 1}`}
          className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
          draggable={false}
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div
          className="flex justify-center gap-1.5 mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === index ? "w-6 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WhatsApp-Style Audio Waveform Player ────────────────────────────────────
function AudioPlayer({
  audioUrl,
  waveform,
  duration,
  isOutgoing,
  isRead = false,
}: {
  audioUrl?: string;
  waveform: number[];
  duration?: string;
  isOutgoing: boolean;
  isRead?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Initialize and attach audio events
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
        const secs = Math.floor(audio.currentTime);
        setCurrentTime(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Fallback smooth simulation when no real audio URL
  const [simProgress, setSimProgress] = useState(0);
  useEffect(() => {
    if (audioUrl || !isPlaying) return;
    const interval = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.02 * playbackSpeed;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, audioUrl, playbackSpeed]);

  const displayProgress = audioUrl ? progress : simProgress;

  const togglePlay = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying((prev) => {
        if (prev) setSimProgress(0);
        return !prev;
      });
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (audioUrl && audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = frac * audioRef.current.duration;
      setProgress(frac);
    } else {
      setSimProgress(frac);
    }
  };

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-[24px] px-3.5 py-2.5 shadow-md select-none transition-all ${
        isOutgoing ? "bg-[#1C1C1E] text-white" : "bg-[#ECEEF2] text-[#18181B]"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Play / Pause circular button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-sm ${
            isOutgoing
              ? "bg-[#25D366] text-black"
              : "bg-[#1F5C4A] text-white"
          }`}
          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? (
            <Pause className={`h-4 w-4 ${isOutgoing ? "fill-black text-black" : "fill-white text-white"}`} />
          ) : (
            <Play className={`h-4 w-4 ml-0.5 ${isOutgoing ? "fill-black text-black" : "fill-white text-white"}`} />
          )}
        </button>

        {/* WhatsApp Audio Waveform with Active Scrubber */}
        <div
          className="relative flex flex-1 items-center justify-between gap-[2.5px] h-8 cursor-pointer group"
          onClick={handleSeek}
          role="slider"
          aria-label="Audio waveform progress"
        >
          {waveform.map((height, i) => {
            const fraction = i / waveform.length;
            const isPlayed = fraction <= displayProgress;
            const isCurrent = Math.abs(fraction - displayProgress) < 1 / waveform.length;

            return (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isOutgoing ? "bg-[#34B7F1]" : "bg-[#1F5C4A]"
                    : isOutgoing ? "bg-white/30" : "bg-neutral-400/40"
                } ${isPlaying && isCurrent ? "scale-y-125" : ""}`}
                style={{
                  height: `${Math.max(6, (height / 100) * 26)}px`,
                }}
              />
            );
          })}

          {/* Smooth moving scrubber indicator head */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 -ml-1.5 h-3 w-3 rounded-full shadow-sm pointer-events-none transition-transform duration-75 ${
              isOutgoing ? "bg-[#34B7F1]" : "bg-[#1F5C4A]"
            }`}
            style={{
              left: `${Math.min(98, Math.max(2, displayProgress * 100))}%`,
            }}
          />
        </div>

        {/* Speed button (1x, 1.5x, 2x) */}
        {isPlaying && (
          <button
            type="button"
            onClick={cycleSpeed}
            className={`flex h-6 px-1.5 items-center justify-center rounded-full text-[10px] font-bold tracking-tight transition-transform active:scale-90 cursor-pointer ${
              isOutgoing
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-black/10 text-neutral-800 hover:bg-black/15"
            }`}
            title="Change playback speed"
          >
            {playbackSpeed}x
          </button>
        )}
      </div>

      {/* Voice note footer: timer & listened status indicator */}
      <div className="flex items-center justify-between px-1 text-[11px] opacity-75">
        <span className="font-mono">
          {isPlaying ? currentTime : (duration || "0:00")}
        </span>

        <span className="flex items-center gap-1">
          {/* Blue mic icon if listened, green if unplayed */}
          <Mic
            className={`w-3.5 h-3.5 ${
              isRead ? "text-[#34B7F1]" : isOutgoing ? "text-[#25D366]" : "text-neutral-500"
            }`}
          />
        </span>
      </div>
    </div>
  );
}

// ─── Main MessageBubble Component ────────────────────────────────────────────
export default function MessageBubble({
  message,
  showSenderName = false,
  onReply,
  onPreviewPhotos,
}: MessageBubbleProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const isOutgoing = message.isOutgoing;
  const isRead = message.status === "read";

  const waveform = message.audioWaveform || [
    24, 45, 60, 30, 80, 50, 90, 75, 40, 65, 85, 30, 55, 70, 95, 40, 20, 60, 80, 45, 30, 70, 40, 20,
  ];

  const audioUrl = message.attachment?.type === "file" && message.attachment.url
    ? message.attachment.url
    : undefined;

  const openLightbox = (startIndex: number = 0) => {
    if (onPreviewPhotos && message.photosStack) {
      onPreviewPhotos(message.photosStack);
    } else {
      setLightboxIndex(startIndex);
      setShowLightbox(true);
    }
  };

  return (
    <div
      className={`group relative flex flex-col mb-3 select-none ${
        isOutgoing ? "items-end" : "items-start"
      }`}
    >
      {/* Sender name for group chats */}
      {!isOutgoing && showSenderName && message.senderName && (
        <span className="text-[11px] font-semibold text-neutral-500 ml-3 mb-1">
          {message.senderName}
        </span>
      )}

      {/* 1. Tilted Photo Stack Gallery */}
      {message.photosStack && message.photosStack.length > 0 && (
        <div className="mb-2 max-w-[280px]">
          <div
            className="relative cursor-pointer select-none group/stack p-2 pt-3"
            onClick={() => openLightbox(0)}
          >
            {/* Background card (tilted right) */}
            <div className="absolute top-2 left-6 w-[210px] h-[190px] rounded-[22px] overflow-hidden shadow-md rotate-[4deg] transition-transform duration-300 group-hover/stack:rotate-[7deg] border-2 border-white bg-neutral-200">
              <img
                src={message.photosStack[1] || message.photosStack[0]}
                alt="Stacked gallery photo"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Front card (tilted slightly left) */}
            <div className="relative w-[210px] h-[190px] rounded-[22px] overflow-hidden shadow-xl -rotate-[3deg] transition-transform duration-300 group-hover/stack:-rotate-[1deg] border-2 border-white bg-neutral-100 z-10">
              <img
                src={message.photosStack[0]}
                alt="Main gallery photo"
                className="w-full h-full object-cover"
              />

              {/* Photo Count Pill Badge */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white shadow-sm border border-white/20">
                <span>{message.photosCount || message.photosStack.length} photos</span>
              </div>
            </div>
          </div>

          {/* Caption Bubble underneath photo stack */}
          {message.content && message.content !== "Shared an image" && !message.content.startsWith("Shared ") && (
            <div className="mt-1.5 ml-1 inline-block rounded-[20px] bg-[#ECEEF2] text-[#18181B] px-4 py-2.5 text-[14px] leading-relaxed shadow-2xs">
              <p>{message.content}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-1 ml-2 text-[11px] font-normal text-[#9B9E9C]">
            {message.timestamp}
          </div>
        </div>
      )}

      {/* 2. WhatsApp-Style Animated Audio Waveform Player */}
      {message.audioWaveform && (
        <div className="mb-1.5 max-w-[290px] w-full">
          <AudioPlayer
            audioUrl={audioUrl}
            waveform={waveform}
            duration={message.audioDuration}
            isOutgoing={isOutgoing}
            isRead={isRead}
          />
        </div>
      )}

      {/* 3. Regular Text Message Bubble */}
      {!message.photosStack && !message.audioWaveform && message.content && (
        <div
          className={`relative max-w-[80%] px-4 py-2.5 text-[14px] leading-relaxed transition-all shadow-2xs ${
            isOutgoing
              ? "bg-[#1C1C1E] text-white rounded-[22px] rounded-br-[6px]"
              : "bg-[#ECEEF2] text-[#18181B] rounded-[22px] rounded-bl-[6px]"
          }`}
        >
          {/* Reply quote preview if present */}
          {message.replyTo && (
            <div
              className={`mb-2 rounded-xl p-2.5 text-xs border-l-2 ${
                isOutgoing
                  ? "bg-white/10 text-white/90 border-white/60"
                  : "bg-white/90 text-neutral-600 border-neutral-900"
              }`}
            >
              <span className="block font-semibold">
                {message.replyTo.senderName}
              </span>
              <span className="truncate block opacity-80">
                {message.replyTo.text}
              </span>
            </div>
          )}

          {/* Text content */}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      )}

      {/* Subtext info: timestamp & instant read receipt ticks */}
      {!message.photosStack && (
        <div
          className={`flex items-center gap-1.5 mt-1 px-1 text-[11px] select-none ${
            isOutgoing ? "text-[#9B9E9C] mr-1" : "text-[#9B9E9C] ml-1"
          }`}
        >
          <span>{message.timestamp}</span>

          {/* Real-time WhatsApp ticks: Sent (1 grey), Delivered (2 grey), Read/Seen (2 blue) */}
          {isOutgoing && (
            <span className="flex items-center gap-1 text-[11px] font-medium transition-colors">
              {message.status === "read" ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" strokeWidth={2.2} />
                  <span className="text-[#34B7F1]">Read</span>
                </>
              ) : message.status === "delivered" ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-[#9B9E9C]" strokeWidth={2} />
                  <span className="text-[#9B9E9C]">Delivered</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#9B9E9C]" strokeWidth={2} />
                  <span className="text-[#9B9E9C]">Sent</span>
                </>
              )}
            </span>
          )}
        </div>
      )}

      {/* Image Lightbox with swipe support */}
      {showLightbox && message.photosStack && (
        <ImageLightbox
          photos={message.photosStack}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
