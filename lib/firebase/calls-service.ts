import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  set as rtdbSet,
  onValue,
  push as rtdbPush,
  remove as rtdbRemove,
  off,
  get as rtdbGet,
} from "firebase/database";
import { db, rtdb } from "./config";
import { CallRecord, User } from "@/types";

/**
 * Subscribes to genuine call history records in Firestore.
 */
export function subscribeCallHistory(
  userId: string,
  onUpdate: (calls: CallRecord[]) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const callsRef = collection(db, "calls");
  const q = query(
    callsRef,
    where("participantIds", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: (CallRecord & { createdAtMs?: number })[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const otherParticipant =
          d.caller?.id === userId ? d.recipient : d.caller || {
            id: docSnap.id,
            name: "Contact",
            userNumber: "",
            email: "",
            status: "offline",
          };

        const createdAtMs =
          d.createdAt?.toMillis ? d.createdAt.toMillis() :
          d.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0;

        records.push({
          id: docSnap.id,
          participant: otherParticipant,
          type: d.type || "audio",
          direction: d.direction || (d.caller?.id === userId ? "outgoing" : "incoming"),
          timestamp: d.timestampStr || "Recent",
          duration: d.duration,
          createdAtMs,
        });
      });

      records.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onUpdate(records);
    },
    (err) => {
      console.warn("Call history subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Records a real call event in Firestore.
 */
export async function recordCallLog(data: {
  caller: User;
  recipient: User;
  type: "audio" | "video";
  direction: "incoming" | "outgoing" | "missed";
  duration?: string;
}) {
  const callsRef = collection(db, "calls");
  const now = new Date();
  const timeStr = `${now.toLocaleDateString([], { month: "short", day: "numeric" })}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  // Sanitize caller/recipient — no undefined fields allowed in Firestore
  const sanitize = (u: User) => ({
    id: u.id || "",
    name: u.name || "User",
    userNumber: u.userNumber || "",
    email: u.email || "",
    avatarUrl: u.avatarUrl || "",
    status: u.status || "offline",
    bio: u.bio || "",
  });

  await addDoc(callsRef, {
    caller: sanitize(data.caller),
    recipient: sanitize(data.recipient),
    participantIds: [data.caller.id, data.recipient.id],
    type: data.type,
    direction: data.direction,
    duration: data.duration || "0:00",
    timestampStr: timeStr,
    createdAt: serverTimestamp(),
  });
}

// ─── Incoming Call Notification via RTDB ────────────────────────────────────

export interface IncomingCallPayload {
  callId: string;
  callType: "audio" | "video";
  callerName: string;
  callerAvatar: string;
  callerId: string;
}

/**
 * Signals an incoming call to the recipient through Realtime Database.
 */
export async function signalIncomingCall(
  callId: string,
  recipientId: string,
  caller: User,
  callType: "audio" | "video"
) {
  const incomingRef = rtdbRef(rtdb, `incomingCalls/${recipientId}`);
  await rtdbSet(incomingRef, {
    callId,
    callType,
    callerName: caller.name || "Unknown",
    callerAvatar: caller.avatarUrl || "",
    callerId: caller.id,
    timestamp: Date.now(),
  });
}

/**
 * Clears the incoming call notification for a user.
 */
export async function clearIncomingCall(recipientId: string) {
  const incomingRef = rtdbRef(rtdb, `incomingCalls/${recipientId}`);
  await rtdbRemove(incomingRef).catch(() => {});
}

/**
 * Subscribes to incoming call notifications for the given user.
 * Returns an unsubscribe function.
 */
export function subscribeIncomingCalls(
  userId: string,
  onIncoming: (payload: IncomingCallPayload | null) => void
) {
  if (!userId) return () => {};
  const incomingRef = rtdbRef(rtdb, `incomingCalls/${userId}`);
  const listener = onValue(incomingRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onIncoming(null);
      return;
    }
    // Auto-expire stale calls (older than 60 seconds)
    if (Date.now() - (val.timestamp || 0) > 60000) {
      rtdbRemove(incomingRef).catch(() => {});
      onIncoming(null);
      return;
    }
    onIncoming(val as IncomingCallPayload);
  });
  return () => off(incomingRef, "value", listener);
}

/**
 * Updates the call status in RTDB (accepted / rejected / ended).
 */
export async function updateCallStatus(
  callId: string,
  status: "ringing" | "accepted" | "rejected" | "ended"
) {
  const statusRef = rtdbRef(rtdb, `calls/${callId}/status`);
  await rtdbSet(statusRef, status);
}

/**
 * Subscribes to the call status.
 */
export function subscribeCallStatus(
  callId: string,
  onStatus: (status: string | null) => void
) {
  if (!callId) return () => {};
  const statusRef = rtdbRef(rtdb, `calls/${callId}/status`);
  const listener = onValue(statusRef, (snap) => {
    onStatus(snap.val());
  });
  return () => off(statusRef, "value", listener);
}

// ─── WebRTC Signaling Session ────────────────────────────────────────────────

export class WebRTCCallSession {
  private callId: string;
  private currentUserId: string;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isCaller: boolean = false;
  private iceCandidateBuffer: RTCIceCandidateInit[] = [];

  constructor(callId: string, currentUserId: string, isCaller: boolean) {
    this.callId = callId;
    this.currentUserId = currentUserId;
    this.isCaller = isCaller;
  }

  async startLocalMedia(video: boolean = false, audio: boolean = true): Promise<MediaStream | null> {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: video ? { facingMode: "user" } : false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        return this.localStream;
      }
    } catch (err) {
      console.warn("Could not capture local media stream:", err);
    }
    return null;
  }

  initPeerConnection(
    onRemoteTrack: (stream: MediaStream) => void,
    onConnectionState?: (state: string) => void
  ) {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    this.pc = new RTCPeerConnection(config);
    this.remoteStream = new MediaStream();

    this.pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.remoteStream) {
        onRemoteTrack(this.remoteStream);
      }
    };

    if (onConnectionState) {
      this.pc.onconnectionstatechange = () => {
        if (this.pc) onConnectionState(this.pc.connectionState);
      };
    }

    // Add local tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.pc) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    const candidateChannel = this.isCaller ? "callerCandidates" : "calleeCandidates";
    const remoteCandidateChannel = this.isCaller ? "calleeCandidates" : "callerCandidates";

    // Send ICE candidates via RTDB
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatesRef = rtdbRef(rtdb, `calls/${this.callId}/signaling/${candidateChannel}`);
        rtdbPush(candidatesRef, event.candidate.toJSON()).catch(() => {});
      }
    };

    // Listen for remote ICE candidates and drain buffer after remote description is set
    const remoteCandidatesRef = rtdbRef(rtdb, `calls/${this.callId}/signaling/${remoteCandidateChannel}`);
    onValue(remoteCandidatesRef, (snapshot) => {
      snapshot.forEach((child) => {
        const candidate = child.val();
        if (!candidate) return;
        if (this.pc?.remoteDescription) {
          this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        } else {
          this.iceCandidateBuffer.push(candidate);
        }
      });
    });

    if (this.isCaller) {
      // Caller: create offer → set local → write to RTDB → wait for answer
      this.pc
        .createOffer()
        .then((offer) => {
          this.pc?.setLocalDescription(offer);
          rtdbSet(rtdbRef(rtdb, `calls/${this.callId}/signaling/offer`), {
            type: offer.type,
            sdp: offer.sdp,
          });
        })
        .catch(() => {});

      onValue(rtdbRef(rtdb, `calls/${this.callId}/signaling/answer`), (snap) => {
        const answer = snap.val();
        if (answer && !this.pc?.currentRemoteDescription) {
          this.pc
            ?.setRemoteDescription(new RTCSessionDescription(answer))
            .then(() => this.drainIceCandidates())
            .catch(() => {});
        }
      });
    } else {
      // Callee: listen for offer → create answer → write to RTDB
      onValue(rtdbRef(rtdb, `calls/${this.callId}/signaling/offer`), (snap) => {
        const offer = snap.val();
        if (offer && !this.pc?.currentRemoteDescription) {
          this.pc
            ?.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => this.drainIceCandidates())
            .then(() => this.pc?.createAnswer())
            .then((answer) => {
              if (!answer) return;
              this.pc?.setLocalDescription(answer);
              rtdbSet(rtdbRef(rtdb, `calls/${this.callId}/signaling/answer`), {
                type: answer.type,
                sdp: answer.sdp,
              });
            })
            .catch(() => {});
        }
      });
    }
  }

  private drainIceCandidates() {
    while (this.iceCandidateBuffer.length > 0) {
      const candidate = this.iceCandidateBuffer.shift();
      if (candidate && this.pc?.remoteDescription) {
        this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    }
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  endSession() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.remoteStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.pc = null;
    // Clear signaling channel in RTDB
    rtdbRemove(rtdbRef(rtdb, `calls/${this.callId}/signaling`)).catch(() => {});
    rtdbRemove(rtdbRef(rtdb, `calls/${this.callId}/status`)).catch(() => {});
  }
}
