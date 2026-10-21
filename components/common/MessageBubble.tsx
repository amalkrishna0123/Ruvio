"use client";

import React, { useState, useEffect } from "react";
import { Message } from "@/types";
import { Play, Pause, Check, CheckCheck, Reply, Copy, Smile, Layers, X, ChevronRight } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  showSenderName?: boolean;
  onReply?: (msg: Message) => void;
  onPreviewPhotos?: (photos: string[]) => void;
}

export default function MessageBubble({
  message,
  showSenderName = false,
  onReply,
  onPreviewPhotos,
}: MessageBubbleProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0.4); // 40% initial preview
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const isOutgoing = message.isOutgoing;

  // Audio waveform animation simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 1) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 0.04;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const waveform = message.audioWaveform || [
    24, 45, 60, 30, 80, 50, 90, 75, 40, 65, 85, 30, 55, 70, 95, 40, 20, 60, 80, 45, 30, 70, 40, 20
  ];

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

      {/* 1. Tilted Photo Stack Gallery (Image 1 Left) */}
      {message.photosStack && message.photosStack.length > 0 && (
        <div className="mb-2 max-w-[280px]">
          <div
            className="relative cursor-pointer select-none group/stack p-2 pt-3"
            onClick={() => {
              if (onPreviewPhotos) {
                onPreviewPhotos(message.photosStack!);
              } else {
                setShowLightbox(true);
              }
            }}
          >
            {/* Background card 2 (tilted right) */}
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
                <span>{message.photosCount || 24} photos</span>
              </div>
            </div>
          </div>

          {/* Caption Bubble underneath photo stack */}
          {message.content && (
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

      {/* 2. Audio Waveform Player (Image 1 Left) */}
      {message.audioWaveform && (
        <div className="mb-1.5 max-w-[280px]">
          <div className="flex items-center gap-3 rounded-[24px] bg-[#1C1C1E] px-4 py-2.5 shadow-md">
            {/* Play / Pause circular button */}
            <button
              type="button"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-sm"
              aria-label={isPlayingAudio ? "Pause voice note" : "Play voice note"}
            >
              {isPlayingAudio ? (
                <Pause className="h-4 w-4 fill-black text-black" />
              ) : (
                <Play className="h-4 w-4 fill-black text-black ml-0.5" />
              )}
            </button>

            {/* Sound Wave Equalizer Bars */}
            <div className="flex flex-1 items-center justify-between gap-[2px] h-7 cursor-pointer"
                 onClick={() => setIsPlayingAudio(!isPlayingAudio)}>
              {waveform.map((height, i) => {
                const fraction = i / waveform.length;
                const isPlayed = fraction <= audioProgress;
                return (
                  <span
                    key={i}
                    className={`w-[2.5px] rounded-full transition-all duration-150 ${
                      isPlayed ? "bg-white" : "bg-white/30"
                    } ${isPlayingAudio && isPlayed ? "animate-pulse" : ""}`}
                    style={{
                      height: `${Math.max(6, (height / 100) * 24)}px`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Regular Text Message Bubble */}
      {!message.photosStack && message.content && (
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

      {/* Subtext info: timestamp & read receipt (Image 1) */}
      {!message.photosStack && (
        <div
          className={`flex items-center gap-1.5 mt-1 px-1 text-[11px] select-none ${
            isOutgoing ? "text-[#9B9E9C] mr-1" : "text-[#9B9E9C] ml-1"
          }`}
        >
          <span>{message.timestamp}</span>
          {isOutgoing && (
            <span className="text-[11px] font-medium text-[#9B9E9C]">
              {message.status === "read" ? "Read" : "Delivered"}
            </span>
          )}
        </div>
      )}

      {/* Lightbox photo preview modal */}
      {showLightbox && message.photosStack && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-xl animate-fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            onClick={() => setShowLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={message.photosStack[lightboxIndex]}
              alt="Expanded photo preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
            {message.photosStack.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {message.photosStack.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      lightboxIndex === idx ? "w-6 bg-white" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
