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
} from "firebase/firestore";
import {
  ref as rtdbRef,
  set as rtdbSet,
  onValue,
  remove as rtdbRemove,
  serverTimestamp as rtdbServerTimestamp,
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
        // Determine recipient participant from participants array/map
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
        let lastMsgStatus: "sent" | "delivered" | "read" =
          (data.lastMessage?.status as any) || "delivered";

        // Only mark as "read" (blue ticks) when: message is outgoing AND recipient's
        // unreadCount is 0 AND Firestore status is explicitly "read".
        // In all other outgoing cases, show "delivered" (grey double tick).
        const recipientId = otherParticipant?.id || "";
        const recipientUnread = data.unreadCounts?.[recipientId] ?? 1;
        if (isOutgoing) {
          if (data.lastMessage?.status === "read" && recipientUnread === 0) {
            lastMsgStatus = "read";
          } else {
            lastMsgStatus = "delivered";
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
            hasPhotoMedia: !!data.lastMessage?.hasPhotoMedia,
          },
          unreadCount: data.unreadCounts?.[currentUserId] || 0,
          isPinned: !!data.pinnedUsers?.[currentUserId],
          isMuted: !!data.mutedUsers?.[currentUserId],
          updatedAtMs,
        });
      });

      // Sort descending by updated timestamp in memory (no composite index required)
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
      snapshot.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          content: data.content || "",
          timestamp: data.timestamp || "Just Now",
          isOutgoing: data.senderId === currentUserId,
          status: data.status || "sent",
          replyTo: data.replyTo,
          audioWaveform: data.audioWaveform,
          audioDuration: data.audioDuration,
          photosStack: data.photosStack,
          photosCount: data.photosCount,
          attachment: data.attachment,
        });
      });
      onUpdate(msgs);
    },
    (err) => {
      console.warn("Messages subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Sends a real message to Firestore.
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
    status: "delivered",
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
    "lastMessage.status": "delivered",
    "lastMessage.hasPhotoMedia": !!(extra?.photosStack?.length || extra?.attachment?.type === "image"),
    updatedAt: serverTimestamp(),
  };

  if (recipientId) {
    convUpdates[`unreadCounts.${recipientId}`] = increment(1);
  }

  await updateDoc(convRef, convUpdates).catch(() => {});
}

/**
 * Updates Realtime Database typing status.
 */
let typingTimeout: any = null;
export function reportTyping(conversationId: string, userId: string, isTyping: boolean) {
  if (!conversationId || !userId) return;
  const userTypingRef = rtdbRef(rtdb, `typing/${conversationId}/${userId}`);

  if (isTyping) {
    rtdbSet(userTypingRef, true);
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      rtdbRemove(userTypingRef);
    }, 2500);
  } else {
    rtdbRemove(userTypingRef);
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
  return onValue(convTypingRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onTypingChange(false);
      return;
    }
    const hasOther = Object.keys(val).some((uid) => uid !== currentUserId && val[uid] === true);
    onTypingChange(hasOther);
  });
}

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
  return onValue(userRef, (snap) => {
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
}

/**
 * Marks messages in a conversation as read ONLY when viewed by the recipient.
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

    // ONLY mark lastMessage as 'read' if current user is the RECIPIENT of the last message
    // (meaning someone else sent it, and current user has now viewed it)
    const isRecipientOfLastMessage =
      lastMsg && lastMsg.senderId && lastMsg.senderId !== currentUserId;

    if (isRecipientOfLastMessage) {
      updates["lastMessage.status"] = "read";
    }

    await updateDoc(convRef, updates).catch(() => {});

    // Also update all incoming messages from the other participant to 'read'
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const msgsSnap = await getDocs(msgsRef).catch(() => null);
    if (msgsSnap && !msgsSnap.empty) {
      const updatePromises: Promise<any>[] = [];
      msgsSnap.forEach((msgDoc) => {
        const d = msgDoc.data();
        if (d.senderId && d.senderId !== currentUserId && d.status !== "read") {
          updatePromises.push(
            updateDoc(doc(db, "conversations", conversationId, "messages", msgDoc.id), {
              status: "read",
            }).catch(() => {})
          );
        }
      });
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    }
  } catch (err) {
    console.warn("Error marking conversation as read:", err);
  }
}

