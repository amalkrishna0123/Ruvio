"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  UserPlus,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  SwitchCamera,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";

function CallInterfaceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const callName = searchParams.get("name") || "Chelsea Apanta";

  // Call timer starting at 20:10 (1210 seconds) from Image 1!
  const [seconds, setSeconds] = useState(1210);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const handleEndCall = () => {
    router.push("/home");
  };

  return (
    <div className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-black select-none">
      {/* 1. Full-bleed remote video stream (Image 1 Right) */}
      <div className="absolute inset-0 z-0">
        <img
          src={isSwapped ? "/images/pip_selfie.jpg" : "/images/video_call_remote.jpg"}
          alt={callName}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isVideoMuted && !isSwapped ? "opacity-20 blur-xl" : "opacity-100"
          }`}
        />
        {/* Subtle cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* 2. Top Navigation Bar (Image 1 Right) */}
      <header className="relative z-20 flex items-center justify-between p-4 pt-6">
        {/* Back Button in frosted glass circle */}
        <Link
          href="/home"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-black/50 active:scale-95 transition-all shadow-md"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 -translate-x-0.5" strokeWidth={2.2} />
        </Link>

        {/* Add User / Participant in frosted glass circle */}
        <button
          type="button"
          onClick={() => alert("Invite link copied to clipboard")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-black/50 active:scale-95 transition-all shadow-md cursor-pointer"
          aria-label="Add participants"
        >
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </header>

      {/* 3. Picture-in-Picture (PiP) Window (Top Right - Image 1 Right) */}
      <div
        className="absolute top-18 right-4 z-20 w-[115px] h-[155px] rounded-[22px] overflow-hidden border border-white/30 shadow-2xl cursor-pointer bg-neutral-900 group"
        onClick={() => setIsSwapped(!isSwapped)}
        title="Tap to swap views"
      >
        <img
          src={isSwapped ? "/images/video_call_remote.jpg" : "/images/pip_selfie.jpg"}
          alt="Self preview"
          className="h-full w-full object-cover"
        />

        {/* Flip camera icon in top-right of PiP */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFrontCamera(!isFrontCamera);
          }}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 active:scale-90 transition-all cursor-pointer"
          aria-label="Switch camera"
        >
          <SwitchCamera className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 4. More Options Popup Sheet */}
      {showMoreMenu && (
        <div className="relative z-30 mx-auto w-full max-w-xs mb-3 rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/20 p-3 shadow-2xl text-white text-xs animate-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 font-medium">
            <span>Call Settings</span>
            <span className="text-[10px] text-emerald-400 font-mono">1080p HD</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => alert("Studio lighting & beauty filter enabled")}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Studio Light</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSwapped(!isSwapped)}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-blue-300" />
              <span>Swap Feeds</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Floating Liquid Glass Bottom Call Card (Image 1 Right) */}
      <div className="relative z-20 pb-8 px-4 w-full flex justify-center">
        <div className="w-full max-w-[340px] rounded-[34px] bg-neutral-900/60 backdrop-blur-2xl border border-white/20 px-4 py-4.5 shadow-2xl flex flex-col items-center">
          {/* Caller Name & Timer */}
          <h2 className="text-[16px] font-semibold text-white tracking-tight leading-snug drop-shadow-sm">
            {callName}
          </h2>
          <span className="text-[12px] font-normal text-white/70 tracking-normal mb-3.5">
            {formatTime(seconds)}
          </span>

          {/* Row of 5 Circular Control Buttons */}
          <div className="flex items-center justify-between w-full px-1">
            {/* 1. Mic Button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
                isMuted
                  ? "bg-rose-500/80 text-white border border-rose-400/50"
                  : "bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/10"
              }`}
              aria-label={isMuted ? "Unmute mic" : "Mute mic"}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* 2. Speaker Button */}
            <button
              type="button"
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
                isSpeaker
                  ? "bg-white/25 text-white border border-white/20"
                  : "bg-white/10 text-white/50 border border-white/5"
              }`}
              aria-label={isSpeaker ? "Turn off speaker" : "Turn on speaker"}
            >
              {isSpeaker ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* 3. Video Toggle Button */}
            <button
              type="button"
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
                isVideoMuted
                  ? "bg-rose-500/80 text-white border border-rose-400/50"
                  : "bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/10"
              }`}
              aria-label={isVideoMuted ? "Turn video on" : "Turn video off"}
            >
              {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            {/* 4. End Call Button (Big Coral Red Affordance from screenshot) */}
            <button
              type="button"
              onClick={handleEndCall}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF3B30] text-white hover:bg-[#E03126] active:scale-90 transition-transform shadow-lg shadow-red-950/40 cursor-pointer"
              title="End Call"
              aria-label="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>

            {/* 5. More Options Button */}
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/10 transition-all cursor-pointer"
              aria-label="More call options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AudioVideoCallPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-black text-white text-xs">
          Loading video channel...
        </div>
      }
    >
      <CallInterfaceContent />
    </Suspense>
  );
}
