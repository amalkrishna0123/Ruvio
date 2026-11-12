import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./config";
import { User, AppNotification } from "@/types";

/**
 * Searches for a genuine registered user by 6-digit user number in Firestore.
 */
export async function searchGenuineUser(userNumber: string): Promise<User | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("userNumber", "==", userNumber.trim()));
  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "User",
    userNumber: data.userNumber || userNumber,
    email: data.email || "",
    avatarUrl: data.avatarUrl || "",
    status: data.status || "offline",
    bio: data.bio || "",
    joinedDate: data.joinedDate || "2026",
    role: data.role || "member",
  };
}

/**
 * Subscribes to the authenticated user's genuine connections list.
 */
export function subscribeUserConnections(
  currentUserId: string,
  onUpdate: (connections: User[]) => void
) {
  if (!currentUserId) {
    onUpdate([]);
    return () => {};
  }

  const connRef = collection(db, "users", currentUserId, "connections");
  return onSnapshot(
    connRef,
    (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          name: d.name || "Contact",
          userNumber: d.userNumber || "",
          email: d.email || "",
          avatarUrl: d.avatarUrl || "",
          status: d.status || "offline",
          bio: d.bio || "",
          joinedDate: d.joinedDate || "",
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("Connections subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Sanitizes a User object by replacing any undefined fields with safe defaults
 * before writing to Firestore (Firestore rejects undefined values).
 */
function sanitizeUserForFirestore(user: User): Record<string, any> {
  return {
    id: user.id || "",
    name: user.name || "User",
    userNumber: user.userNumber || "",
    email: user.email || "",
    avatarUrl: user.avatarUrl || "",
    status: user.status || "offline",
    bio: user.bio || "",
    joinedDate: user.joinedDate || "",
    role: user.role || "member",
    // Flatten settings with defaults so no undefined values reach Firestore
    settings: {
      readReceipts: user.settings?.readReceipts ?? true,
      notifications: user.settings?.notifications ?? true,
      ephemeralTimer: user.settings?.ephemeralTimer ?? "off",
    },
  };
}

/**
 * Saves a genuine connection in Firestore and initializes direct conversation.
 */
export async function addGenuineConnection(currentUser: User, contact: User) {
  const sanitizedContact = sanitizeUserForFirestore(contact);
  const sanitizedCurrentUser = sanitizeUserForFirestore(currentUser);

  // 1. Save in user's connections subcollection
  const connDocRef = doc(db, "users", currentUser.id, "connections", contact.id);
  await setDoc(connDocRef, {
    ...sanitizedContact,
    addedAt: serverTimestamp(),
  });

  // 2. Mutual connection
  const reciprocalDocRef = doc(db, "users", contact.id, "connections", currentUser.id);
  await setDoc(reciprocalDocRef, {
    ...sanitizedCurrentUser,
    addedAt: serverTimestamp(),
  });

  // 3. Create or find direct conversation in conversations collection
  const convId = [currentUser.id, contact.id].sort().join("_");
  const convDocRef = doc(db, "conversations", convId);

  const now = new Date();
  const timeStr = now
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .toLowerCase()
    .replace(" ", "");

  await setDoc(
    convDocRef,
    {
      id: convId,
      type: "direct",
      participantIds: [currentUser.id, contact.id],
      participant: sanitizedContact,
      owner: sanitizedCurrentUser,
      lastMessage: {
        text: "Connected on Ruvio",
        timestamp: timeStr,
        isOutgoing: true,
        status: "sent",
        senderId: currentUser.id,
        hasPhotoMedia: false,
      },
      unreadCounts: {
        [currentUser.id]: 0,
        [contact.id]: 0,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return convId;
}

/**
 * Removes a connection from Firestore.
 */
export async function removeGenuineConnection(currentUserId: string, contactId: string) {
  const connDocRef = doc(db, "users", currentUserId, "connections", contactId);
  await deleteDoc(connDocRef);
}

/**
 * Subscribes to genuine notifications for the user from Firestore.
 */
export function subscribeUserNotifications(
  currentUserId: string,
  onUpdate: (notifications: AppNotification[]) => void
) {
  if (!currentUserId) {
    onUpdate([]);
    return () => {};
  }

  const notifRef = collection(db, "notifications");
  const q = query(
    notifRef,
    where("recipientId", "==", currentUserId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: (AppNotification & { createdAtMs?: number })[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAtMs =
          d.createdAt?.toMillis ? d.createdAt.toMillis() :
          d.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0;

        list.push({
          id: docSnap.id,
          type: d.type || "system",
          title: d.title || "Notification",
          description: d.description || "",
          timestamp: d.timestampStr || "Recent",
          isUnread: d.isUnread !== false,
          actionUrl: d.actionUrl,
          createdAtMs,
        });
      });

      // Sort descending by creation timestamp in memory
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

      onUpdate(list);
    },
    (err) => {
      console.warn("Notifications subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const notifDocRef = doc(db, "notifications", notificationId);
  await updateDoc(notifDocRef, { isUnread: false });
}

/**
 * Reports a user through Firestore with optional Cloud Function invocation
 */
export async function submitUserReport(reportedUserId: string, reason: string, details?: string) {
  try {
    const reportRef = await addDoc(collection(db, "reports"), {
      reportedUserId,
      reason,
      details: details || "",
      createdAt: serverTimestamp(),
    });
    return { success: true, reportId: reportRef.id };
  } catch (e) {
    console.warn("Direct Firestore report failed, attempting Cloud Function:", e);
    const reportFn = httpsCallable<{ reportedUserId: string; reason: string; details?: string }, { success: boolean; reportId: string }>(
      functions,
      "reportUser"
    );
    return await reportFn({ reportedUserId, reason, details });
  }
}

/**
 * Blocks a user through Firestore with optional Cloud Function invocation
 */
export async function submitUserBlock(targetUserId: string, block: boolean = true) {
  try {
    const blockRef = doc(db, "blockedUsers", targetUserId);
    await setDoc(blockRef, {
      targetUserId,
      blocked: block,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, blocked: block };
  } catch (e) {
    console.warn("Direct Firestore block failed, attempting Cloud Function:", e);
    const blockFn = httpsCallable<{ targetUserId: string; block: boolean }, { success: boolean; blocked: boolean }>(
      functions,
      "blockUser"
    );
    return await blockFn({ targetUserId, block });
  }
}

