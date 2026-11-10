import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  set as rtdbSet,
  onValue,
  push as rtdbPush,
  remove as rtdbRemove,
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
          type: d.type || "video",
          direction: d.direction || (d.caller?.id === userId ? "outgoing" : "incoming"),
          timestamp: d.timestampStr || "Recent",
          duration: d.duration,
          createdAtMs,
        });
      });

      // Sort descending by creation timestamp in memory
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

  await addDoc(callsRef, {
    caller: data.caller,
    recipient: data.recipient,
    participantIds: [data.caller.id, data.recipient.id],
    type: data.type,
    direction: data.direction,
    duration: data.duration || "0:00",
    timestampStr: timeStr,
    createdAt: serverTimestamp(),
  });
}

/**
 * WebRTC Calling Signaling via Firebase Realtime Database
 */
export class WebRTCCallSession {
  private callId: string;
  private currentUserId: string;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isCaller: boolean = false;

  constructor(callId: string, currentUserId: string, isCaller: boolean) {
    this.callId = callId;
    this.currentUserId = currentUserId;
    this.isCaller = isCaller;
  }

  async startLocalMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: video ? { facingMode: "user" } : false,
          audio,
        });
        return this.localStream;
      }
    } catch (err) {
      console.warn("Could not capture local hardware media stream:", err);
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

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.pc) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    // Exchange ICE candidates through Realtime Database
    const candidateChannel = this.isCaller ? "callerCandidates" : "calleeCandidates";
    const remoteCandidateChannel = this.isCaller ? "calleeCandidates" : "callerCandidates";

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatesRef = rtdbRef(rtdb, `calls/${this.callId}/signaling/${candidateChannel}`);
        rtdbPush(candidatesRef, event.candidate.toJSON());
      }
    };

    // Listen for remote ICE candidates
    const remoteCandidatesRef = rtdbRef(rtdb, `calls/${this.callId}/signaling/${remoteCandidateChannel}`);
    onValue(remoteCandidatesRef, (snapshot) => {
      snapshot.forEach((child) => {
        const candidate = child.val();
        if (candidate && this.pc?.remoteDescription) {
          this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      });
    });

    // Listen for SDP answers / offers
    const callRef = rtdbRef(rtdb, `calls/${this.callId}/signaling`);
    if (this.isCaller) {
      // Caller: create and send offer, wait for answer
      this.pc.createOffer().then((offer) => {
        this.pc?.setLocalDescription(offer);
        rtdbSet(rtdbRef(rtdb, `calls/${this.callId}/signaling/offer`), {
          type: offer.type,
          sdp: offer.sdp,
        });
      });

      onValue(rtdbRef(rtdb, `calls/${this.callId}/signaling/answer`), (snap) => {
        const answer = snap.val();
        if (answer && !this.pc?.currentRemoteDescription) {
          this.pc?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
        }
      });
    } else {
      // Callee: listen for offer, create answer
      onValue(rtdbRef(rtdb, `calls/${this.callId}/signaling/offer`), (snap) => {
        const offer = snap.val();
        if (offer && !this.pc?.currentRemoteDescription) {
          this.pc?.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
            this.pc?.createAnswer().then((answer) => {
              this.pc?.setLocalDescription(answer);
              rtdbSet(rtdbRef(rtdb, `calls/${this.callId}/signaling/answer`), {
                type: answer.type,
                sdp: answer.sdp,
              });
            });
          });
        }
      });
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
    // Clear signaling channel
    rtdbRemove(rtdbRef(rtdb, `calls/${this.callId}/signaling`)).catch(() => {});
  }
}

