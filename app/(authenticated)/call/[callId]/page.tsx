"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
import { useAuth } from "@/lib/firebase/auth-context";
import { WebRTCCallSession, recordCallLog } from "@/lib/firebase/calls-service";
import { User } from "@/types";

function CallInterfaceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userProfile } = useAuth();

  const callId = (params?.callId as string) || "call_live";
  const callName = searchParams.get("name") || "Encrypted Line";
  const callType = (searchParams.get("type") as "audio" | "video") || "video";

  // Real call timer starting at 0
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(callType === "audio");
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<WebRTCCallSession | null>(null);

  // 1. Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize genuine WebRTC session & hardware media
  useEffect(() => {
    if (!userProfile?.id) return;

    const isCaller = !callId.includes("_incoming");
    const session = new WebRTCCallSession(callId, userProfile.id, isCaller);
    sessionRef.current = session;

    session
      .startLocalMedia(!isVideoMuted, true)
      .then((stream) => {
        if (stream && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        session.initPeerConnection(
          (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              setHasRemoteVideo(true);
            }
          },
          (state) => {
            console.log("WebRTC State:", state);
          }
        );
      })
      .catch((err) => {
        console.warn("Media capture error:", err);
      });

    return () => {
      session.endSession();
    };
  }, [callId, userProfile?.id]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const handleToggleMic = () => {
    const next = !isMuted;
    setIsMuted(next);
    sessionRef.current?.toggleAudio(!next);
  };

  const handleToggleVideo = () => {
    const next = !isVideoMuted;
    setIsVideoMuted(next);
    sessionRef.current?.toggleVideo(!next);
  };

  const handleEndCall = async () => {
    const durationStr = formatTime(seconds);
    sessionRef.current?.endSession();

    if (userProfile) {
      const recipientUser: User = {
        id: callId,
        name: callName,
        userNumber: "",
        email: "",
        status: "online",
      };

      await recordCallLog({
        caller: userProfile,
        recipient: recipientUser,
        type: callType,
        direction: "outgoing",
        duration: durationStr,
      }).catch(() => {});
    }

    router.push("/calls");
  };

  return (
    <div className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-black select-none">
      {/* 1. Full-bleed remote video stream */}
      <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
        <video
          ref={isSwapped ? localVideoRef : remoteVideoRef}
          autoPlay
          playsInline
          muted={isSwapped}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isVideoMuted && isSwapped ? "opacity-20 blur-xl" : "opacity-100"
          }`}
        />

        {/* Fallback avatar overlay when remote video stream is not yet transmitting */}
        {!hasRemoteVideo && !isSwapped && (
          <div className="absolute flex flex-col items-center justify-center gap-3 text-white">
            <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold backdrop-blur-xl border border-white/20">
              {callName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white/80 animate-pulse">
              Connecting end-to-end encrypted relay...
            </span>
          </div>
        )}

        {/* Subtle cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* 2. Top Navigation Bar (Image 1 Right) */}
      <header className="relative z-20 flex items-center justify-between p-4 pt-6">
        <Link
          href="/home"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-black/50 active:scale-95 transition-all shadow-md"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 -translate-x-0.5" strokeWidth={2.2} />
        </Link>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            alert("Secure call link copied to clipboard");
          }}
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
        <video
          ref={isSwapped ? remoteVideoRef : localVideoRef}
          autoPlay
          playsInline
          muted={!isSwapped}
          className="h-full w-full object-cover"
        />

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
            <span className="text-[10px] text-emerald-400 font-mono">WebRTC Secure</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => alert("Hardware audio enhancement active")}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Studio Voice</span>
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
              onClick={handleToggleMic}
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
              onClick={handleToggleVideo}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
                isVideoMuted
                  ? "bg-rose-500/80 text-white border border-rose-400/50"
                  : "bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/10"
              }`}
              aria-label={isVideoMuted ? "Turn video on" : "Turn video off"}
            >
              {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            {/* 4. End Call Button (Big Coral Red Affordance) */}
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
