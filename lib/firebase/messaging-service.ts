import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  setDoc,
  getDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  set as rtdbSet,
  onValue,
  remove as rtdbRemove,
  serverTimestamp as rtdbServerTimestamp,
  onDisconnect,
  off,
} from "firebase/database";
import { db, rtdb } from "./config";
import { Conversation, Message, User } from "@/types";

/**
 * Subscribes to all genuine conversations for the authenticated user in Firestore.
 */
export function subscribeConversations(
  currentUserId: string,
  onUpdate: (conversations: Conversation[]) => void
) {
  if (!currentUserId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", currentUserId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const convList: (Conversation & { updatedAtMs?: number })[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const otherParticipant =
          data.participant?.id === currentUserId
            ? data.owner
            : data.participant || {
                id: d.id,
                name: data.title || "Conversation",
                userNumber: "",
                email: "",
                status: "offline",
              };

        const updatedAtMs =
          data.updatedAt?.toMillis ? data.updatedAt.toMillis() :
          data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 :
          data.createdAt?.toMillis ? data.createdAt.toMillis() :
          data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0;

        const isOutgoing = data.lastMessage?.senderId === currentUserId;
        let lastMsgStatus: "sent" | "delivered" | "read" = "delivered";

        if (isOutgoing) {
          const rawStatus = data.lastMessage?.status;
          if (rawStatus === "read") {
            lastMsgStatus = "read";
          } else if (rawStatus === "delivered") {
            lastMsgStatus = "delivered";
          } else {
            lastMsgStatus = "sent";
          }
        }

        convList.push({
          id: d.id,
          type: data.type || "direct",
          participant: otherParticipant,
          lastMessage: {
            text: data.lastMessage?.text || "",
            timestamp: data.lastMessage?.timestamp || "",
            isOutgoing,
            status: lastMsgStatus,
            readAt: data.lastMessage?.readAt,
            hasPhotoMedia: !!data.lastMessage?.hasPhotoMedia,
            senderId: data.lastMessage?.senderId,
          },
          unreadCount: data.unreadCounts?.[currentUserId] || 0,
          isPinned: !!data.pinnedUsers?.[currentUserId],
          isMuted: !!data.mutedUsers?.[currentUserId],
          updatedAtMs,
        });
      });

      // Sort descending by updated timestamp in memory
      convList.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));

      onUpdate(convList);
    },
    (err) => {
      console.warn("Conversations subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Subscribes to real-time messages within a genuine conversation.
 * Automatically acknowledges delivery of incoming messages in the background.
 */
export function subscribeMessages(
  conversationId: string,
  currentUserId: string,
  onUpdate: (messages: Message[]) => void
) {
  if (!conversationId) {
    onUpdate([]);
    return () => {};
  }

  const msgsRef = collection(db, "conversations", conversationId, "messages");
  const q = query(msgsRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: Message[] = [];
      const messagesToMarkDelivered: string[] = [];

      snapshot.forEach((d) => {
        const data = d.data();
        const isOutgoing = data.senderId === currentUserId;
        const msgStatus: "sent" | "delivered" | "read" = data.status || "sent";

        // Track incoming messages that are still in "sent" state to mark as "delivered"
        if (!isOutgoing && msgStatus === "sent") {
          messagesToMarkDelivered.push(d.id);
        }

        msgs.push({
          id: d.id,
          conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          content: data.content || "",
          timestamp: data.timestamp || "Just Now",
          isOutgoing,
          status: msgStatus,
          createdAt: data.createdAt,
          deliveredAt: data.deliveredAt,
          readAt: data.readAt,
          replyTo: data.replyTo,
          audioWaveform: data.audioWaveform,
          audioDuration: data.audioDuration,
          photosStack: data.photosStack,
          photosCount: data.photosCount,
          attachment: data.attachment,
        });
      });

      onUpdate(msgs);

      // Acknowledge delivery in the background if receiver receives them
      if (messagesToMarkDelivered.length > 0) {
        messagesToMarkDelivered.forEach((msgId) => {
          updateDoc(doc(db, "conversations", conversationId, "messages", msgId), {
            status: "delivered",
            deliveredAt: serverTimestamp(),
          }).catch(() => {});
        });

        // Also update conversation lastMessage status if it was sent
        updateDoc(doc(db, "conversations", conversationId), {
          "lastMessage.status": "delivered",
        }).catch(() => {});
      }
    },
    (err) => {
      console.warn("Messages subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Sends a real message to Firestore with initial "sent" status.
 */
export async function sendMessage(
  conversationId: string,
  sender: User,
  content: string,
  extra?: {
    replyTo?: Message["replyTo"];
    attachment?: Message["attachment"];
    photosStack?: string[];
    audioWaveform?: number[];
    audioDuration?: string;
  }
) {
  const msgsRef = collection(db, "conversations", conversationId, "messages");
  const now = new Date();
  const timeStr = now
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .toLowerCase()
    .replace(" ", "");

  const msgPayload: any = {
    conversationId,
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatarUrl || "",
    content,
    timestamp: timeStr,
    status: "sent",
    createdAt: serverTimestamp(),
  };

  if (extra?.replyTo) msgPayload.replyTo = extra.replyTo;
  if (extra?.attachment) msgPayload.attachment = extra.attachment;
  if (extra?.photosStack) {
    msgPayload.photosStack = extra.photosStack;
    msgPayload.photosCount = extra.photosStack.length;
  }
  if (extra?.audioWaveform) msgPayload.audioWaveform = extra.audioWaveform;
  if (extra?.audioDuration) msgPayload.audioDuration = extra.audioDuration;

  await addDoc(msgsRef, msgPayload);

  // Update conversation record
  const convRef = doc(db, "conversations", conversationId);
  const convSnap = await getDoc(convRef).catch(() => null);
  let recipientId = "";
  if (convSnap && convSnap.exists()) {
    const pIds: string[] = convSnap.data()?.participantIds || [];
    recipientId = pIds.find((id) => id !== sender.id) || "";
  }

  const convUpdates: any = {
    "lastMessage.text": content || (extra?.attachment ? "Attachment" : "Media"),
    "lastMessage.timestamp": timeStr,
    "lastMessage.senderId": sender.id,
    "lastMessage.status": "sent",
    "lastMessage.hasPhotoMedia": !!(extra?.photosStack?.length || extra?.attachment?.type === "image"),
    updatedAt: serverTimestamp(),
  };

  if (recipientId) {
    convUpdates[`unreadCounts.${recipientId}`] = increment(1);
  }

  await updateDoc(convRef, convUpdates).catch(() => {});
}

// ─── Real-Time Typing Indicator (RTDB) ──────────────────────────────────────

let typingTimeoutMap: Record<string, any> = {};

/**
 * Immediately updates Realtime Database typing status with disconnect cleanup.
 */
export function reportTyping(conversationId: string, userId: string, isTyping: boolean) {
  if (!conversationId || !userId) return;
  const key = `${conversationId}_${userId}`;
  const userTypingRef = rtdbRef(rtdb, `typing/${conversationId}/${userId}`);

  if (isTyping) {
    // Clear existing timeout
    if (typingTimeoutMap[key]) {
      clearTimeout(typingTimeoutMap[key]);
    }

    // Set onDisconnect hook so crashes / closed tabs immediately remove typing
    onDisconnect(userTypingRef).remove().catch(() => {});

    rtdbSet(userTypingRef, true).catch(() => {});

    // Debounce auto-clear after 2 seconds of inactivity
    typingTimeoutMap[key] = setTimeout(() => {
      rtdbRemove(userTypingRef).catch(() => {});
      delete typingTimeoutMap[key];
    }, 2000);
  } else {
    if (typingTimeoutMap[key]) {
      clearTimeout(typingTimeoutMap[key]);
      delete typingTimeoutMap[key];
    }
    rtdbRemove(userTypingRef).catch(() => {});
  }
}

/**
 * Subscribes to real-time typing indicators in Realtime Database.
 */
export function subscribeTyping(
  conversationId: string,
  currentUserId: string,
  onTypingChange: (isOtherTyping: boolean) => void
) {
  if (!conversationId) {
    onTypingChange(false);
    return () => {};
  }

  const convTypingRef = rtdbRef(rtdb, `typing/${conversationId}`);
  const listener = onValue(convTypingRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onTypingChange(false);
      return;
    }
    const hasOther = Object.keys(val).some((uid) => uid !== currentUserId && val[uid] === true);
    onTypingChange(hasOther);
  });

  return () => off(convTypingRef, "value", listener);
}

// ─── Real-Time Voice Recording Indicator (RTDB) ──────────────────────────────

let recordingTimeoutMap: Record<string, any> = {};

/**
 * Immediately updates Realtime Database voice recording status with disconnect cleanup.
 */
export function reportRecording(conversationId: string, userId: string, isRecording: boolean) {
  if (!conversationId || !userId) return;
  const key = `${conversationId}_${userId}`;
  const userRecRef = rtdbRef(rtdb, `recording/${conversationId}/${userId}`);

  if (isRecording) {
    if (recordingTimeoutMap[key]) {
      clearTimeout(recordingTimeoutMap[key]);
    }

    // Clean up on disconnect
    onDisconnect(userRecRef).remove().catch(() => {});

    rtdbSet(userRecRef, true).catch(() => {});

    // Safety timeout: max 90 seconds in case recording is abandoned
    recordingTimeoutMap[key] = setTimeout(() => {
      rtdbRemove(userRecRef).catch(() => {});
      delete recordingTimeoutMap[key];
    }, 90000);
  } else {
    if (recordingTimeoutMap[key]) {
      clearTimeout(recordingTimeoutMap[key]);
      delete recordingTimeoutMap[key];
    }
    rtdbRemove(userRecRef).catch(() => {});
  }
}

/**
 * Subscribes to real-time voice recording indicators in Realtime Database.
 */
export function subscribeRecording(
  conversationId: string,
  currentUserId: string,
  onRecordingChange: (isOtherRecording: boolean) => void
) {
  if (!conversationId) {
    onRecordingChange(false);
    return () => {};
  }

  const convRecRef = rtdbRef(rtdb, `recording/${conversationId}`);
  const listener = onValue(convRecRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onRecordingChange(false);
      return;
    }
    const hasOther = Object.keys(val).some((uid) => uid !== currentUserId && val[uid] === true);
    onRecordingChange(hasOther);
  });

  return () => off(convRecRef, "value", listener);
}

// ─── Real Presence (RTDB) ────────────────────────────────────────────────────

/**
 * Subscribes to real presence and last seen of a user via Realtime Database.
 */
export function subscribePresence(
  userId: string,
  onPresence: (presence: { state: "online" | "offline" | "away"; lastSeen?: string }) => void
) {
  if (!userId) {
    onPresence({ state: "offline" });
    return () => {};
  }

  const userRef = rtdbRef(rtdb, `presence/${userId}`);
  const listener = onValue(userRef, (snap) => {
    const val = snap.val();
    if (!val || val.state === "offline") {
      let lastSeenText = "Offline";
      if (val?.lastSeen) {
        const d = new Date(val.lastSeen);
        lastSeenText = `Last seen ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
      onPresence({ state: "offline", lastSeen: lastSeenText });
    } else {
      onPresence({ state: "online", lastSeen: "Active now" });
    }
  });

  return () => off(userRef, "value", listener);
}

// ─── Real-Time Read Receipts (Firestore) ─────────────────────────────────────

/**
 * Marks messages in a conversation as read (seen) instantly when viewed by the recipient.
 * Updates all unread messages with readAt server timestamp, resets unread count,
 * and updates the conversation's lastMessage status to 'read' (double blue ticks).
 */
export async function markConversationAsRead(conversationId: string, currentUserId: string) {
  if (!conversationId || !currentUserId) return;
  const convRef = doc(db, "conversations", conversationId);

  try {
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) return;

    const convData = convSnap.data();
    const lastMsg = convData.lastMessage;

    // Reset unread count for current user
    const updates: any = {
      [`unreadCounts.${currentUserId}`]: 0,
    };

    // Mark lastMessage as 'read' if current user is the recipient of the last message
    const isRecipientOfLastMessage =
      lastMsg && lastMsg.senderId && lastMsg.senderId !== currentUserId;

    if (isRecipientOfLastMessage && lastMsg.status !== "read") {
      updates["lastMessage.status"] = "read";
      updates["lastMessage.readAt"] = serverTimestamp();
    }

    await updateDoc(convRef, updates).catch(() => {});

    // Update all incoming unread messages in the messages subcollection
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const msgsSnap = await getDocs(msgsRef).catch(() => null);

    if (msgsSnap && !msgsSnap.empty) {
      const batch = writeBatch(db);
      let count = 0;

      msgsSnap.forEach((msgDoc) => {
        const d = msgDoc.data();
        if (d.senderId && d.senderId !== currentUserId && d.status !== "read") {
          batch.update(doc(db, "conversations", conversationId, "messages", msgDoc.id), {
            status: "read",
            readAt: serverTimestamp(),
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit().catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Error marking conversation as read:", err);
  }
}
