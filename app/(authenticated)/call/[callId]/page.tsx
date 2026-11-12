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
  Phone,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  WebRTCCallSession,
  recordCallLog,
  signalIncomingCall,
  updateCallStatus,
  subscribeCallStatus,
  clearIncomingCall,
} from "@/lib/firebase/calls-service";
import { subscribeUserConnections } from "@/lib/firebase/connections-service";
import { User } from "@/types";

function CallInterfaceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userProfile } = useAuth();

  const callId = (params?.callId as string) || "call_live";
  const callName = searchParams.get("name") || "Encrypted Line";
  const callType = (searchParams.get("type") as "audio" | "video") || "audio";
  const recipientId = searchParams.get("recipientId") || "";

  // Determine if incoming (callId contains "_incoming")
  const isCaller = !callId.includes("_incoming");

  // Call state
  const [callStatus, setCallStatus] = useState<"ringing" | "accepted" | "ended" | "rejected">(
    isCaller ? "ringing" : "accepted"
  );
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

  // 1. Call timer — only starts once accepted
  useEffect(() => {
    if (callStatus !== "accepted") return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // 2. If caller: signal the recipient & subscribe to call status
  useEffect(() => {
    if (!userProfile?.id || !isCaller) return;

    // Notify recipient of incoming call
    if (recipientId) {
      signalIncomingCall(callId, recipientId, userProfile, callType).catch(() => {});
      updateCallStatus(callId, "ringing").catch(() => {});
    }

    // Watch for recipient's response
    const unsub = subscribeCallStatus(callId, (status) => {
      if (status === "accepted") {
        setCallStatus("accepted");
      } else if (status === "rejected") {
        setCallStatus("rejected");
        setTimeout(() => router.push("/calls"), 1500);
      } else if (status === "ended") {
        setCallStatus("ended");
        setTimeout(() => router.push("/calls"), 1000);
      }
    });

    // Auto-cancel if no answer in 45 seconds
    const timeout = setTimeout(async () => {
      if (callStatus === "ringing") {
        await clearIncomingCall(recipientId).catch(() => {});
        if (userProfile && recipientId) {
          const recipientUser: User = {
            id: recipientId,
            name: callName,
            userNumber: "",
            email: "",
            status: "offline",
          };
          await recordCallLog({
            caller: userProfile,
            recipient: recipientUser,
            type: callType,
            direction: "missed",
          }).catch(() => {});
        }
        router.push("/calls");
      }
    }, 45000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [callId, isCaller, recipientId, userProfile?.id, callType]);

  // 3. Initialize WebRTC media once call is accepted
  useEffect(() => {
    if (!userProfile?.id || callStatus !== "accepted") return;

    const session = new WebRTCCallSession(callId, userProfile.id, isCaller);
    sessionRef.current = session;

    const useVideo = callType === "video";
    session
      .startLocalMedia(useVideo, true)
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
            console.log("WebRTC Connection State:", state);
            if (state === "disconnected" || state === "failed" || state === "closed") {
              handleEndCall();
            }
          }
        );
      })
      .catch((err) => {
        console.warn("Media capture error:", err);
      });

    return () => {
      session.endSession();
    };
  }, [callId, userProfile?.id, callStatus, isCaller, callType]);

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

    await updateCallStatus(callId, "ended").catch(() => {});
    if (recipientId) {
      await clearIncomingCall(recipientId).catch(() => {});
    }

    if (userProfile) {
      const recipientUser: User = {
        id: recipientId || callId,
        name: callName,
        userNumber: "",
        email: "",
        status: "offline",
      };

      await recordCallLog({
        caller: userProfile,
        recipient: recipientUser,
        type: callType,
        direction: callStatus === "accepted" ? "outgoing" : "missed",
        duration: callStatus === "accepted" ? durationStr : undefined,
      }).catch(() => {});
    }

    router.push("/calls");
  };

  // Ringing screen for caller (waiting for acceptance)
  if (callStatus === "ringing") {
    return (
      <div className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-black select-none pb-14 pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-neutral-950" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-28 w-28 rounded-full bg-white/10 flex items-center justify-center text-5xl font-bold text-white backdrop-blur-xl border border-white/20">
            {callName.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-2xl font-semibold text-white">{callName}</h2>
          <span className="text-sm text-white/60 animate-pulse">
            {callType === "video" ? "📹 " : "📞 "}Calling…
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={handleEndCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF3B30] text-white hover:bg-[#E03126] active:scale-90 transition-transform shadow-lg shadow-red-950/40 cursor-pointer"
            aria-label="Cancel call"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
          <span className="text-xs text-white/40">Cancel</span>
        </div>
      </div>
    );
  }

  // Rejected screen
  if (callStatus === "rejected") {
    return (
      <div className="relative flex h-dvh w-full flex-col items-center justify-center gap-4 overflow-hidden bg-black select-none">
        <div className="text-white/60 text-sm">Call declined</div>
      </div>
    );
  }

  // Active call screen
  return (
    <div className="relative flex h-dvh w-full flex-col justify-between overflow-hidden bg-black select-none">
      {/* Full-bleed remote video stream */}
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

        {/* Fallback avatar overlay when remote video not yet transmitting */}
        {!hasRemoteVideo && !isSwapped && (
          <div className="absolute flex flex-col items-center justify-center gap-3 text-white">
            <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold backdrop-blur-xl border border-white/20">
              {callName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white/80 animate-pulse">
              {callType === "video" ? "Connecting video..." : "Connected"}
            </span>
          </div>
        )}

        {/* Cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 pt-6">
        <button
          type="button"
          onClick={() => router.push("/calls")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-black/50 active:scale-95 transition-all shadow-md"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 -translate-x-0.5" strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-black/50 active:scale-95 transition-all shadow-md cursor-pointer"
          aria-label="Add participants"
        >
          <UserPlus className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </header>

      {/* Picture-in-Picture Window */}
      {callType === "video" && (
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
      )}

      {/* More Options Popup */}
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

      {/* Floating Bottom Call Card */}
      <div className="relative z-20 pb-8 px-4 w-full flex justify-center">
        <div className="w-full max-w-[340px] rounded-[34px] bg-neutral-900/60 backdrop-blur-2xl border border-white/20 px-4 py-4 shadow-2xl flex flex-col items-center">
          {/* Caller Name & Timer */}
          <h2 className="text-[16px] font-semibold text-white tracking-tight leading-snug drop-shadow-sm">
            {callName}
          </h2>
          <span className="text-[12px] font-normal text-white/70 tracking-normal mb-3.5">
            {formatTime(seconds)}
          </span>

          {/* Row of Control Buttons */}
          <div className="flex items-center justify-between w-full px-1">
            {/* Mic Button */}
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

            {/* Speaker Button */}
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

            {/* Video Toggle (only for video calls) */}
            {callType === "video" && (
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
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF3B30] text-white hover:bg-[#E03126] active:scale-90 transition-transform shadow-lg shadow-red-950/40 cursor-pointer"
              title="End Call"
              aria-label="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>

            {/* More Options Button */}
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
          Connecting...
        </div>
      }
    >
      <CallInterfaceContent />
    </Suspense>
  );
}
