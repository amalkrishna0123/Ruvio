"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  subscribeIncomingCalls,
  updateCallStatus,
  clearIncomingCall,
  IncomingCallPayload,
} from "@/lib/firebase/calls-service";

export default function IncomingCallOverlay() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [incoming, setIncoming] = useState<IncomingCallPayload | null>(null);

  useEffect(() => {
    if (!userProfile?.id) return;
    const unsub = subscribeIncomingCalls(userProfile.id, (payload) => {
      setIncoming(payload);
    });
    return () => unsub();
  }, [userProfile?.id]);

  if (!incoming) return null;

  const accept = async () => {
    if (!userProfile?.id) return;
    await updateCallStatus(incoming.callId, "accepted").catch(() => {});
    await clearIncomingCall(userProfile.id).catch(() => {});
    setIncoming(null);
    router.push(
      `/call/${incoming.callId}_incoming?name=${encodeURIComponent(incoming.callerName)}&type=${incoming.callType}&recipientId=${incoming.callerId}`
    );
  };

  const reject = async () => {
    if (!userProfile?.id) return;
    await updateCallStatus(incoming.callId, "rejected").catch(() => {});
    await clearIncomingCall(userProfile.id).catch(() => {});
    setIncoming(null);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex justify-center p-3 animate-slide-down">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl p-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-lg">
          {incoming.callerAvatar ? (
            <img
              src={incoming.callerAvatar}
              alt={incoming.callerName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            incoming.callerName.slice(0, 2).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{incoming.callerName}</p>
          <p className="text-white/60 text-xs">
            {incoming.callType === "video" ? "📹 Incoming video call" : "📞 Incoming voice call"}
          </p>
        </div>

        {/* Reject */}
        <button
          type="button"
          onClick={reject}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF3B30] text-white hover:bg-[#E03126] active:scale-90 transition-transform shadow-md cursor-pointer flex-shrink-0"
          aria-label="Decline call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>

        {/* Accept */}
        <button
          type="button"
          onClick={accept}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#30D158] text-white hover:bg-[#28B84D] active:scale-90 transition-transform shadow-md cursor-pointer flex-shrink-0"
          aria-label="Accept call"
        >
          <Phone className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

