"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  onValue,
  set as rtdbSet,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";
import { auth, db, rtdb } from "./config";
import { User } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  error: string | null;
  sendOtp: (userNumber?: string, email?: string) => Promise<{ maskedEmail: string; otpCode: string }>;
  verifyOtpAndLogin: (userNumber: string, otp: string, email?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Mask email for privacy display (e.g., a***e@example.com)
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email || "";
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const maskedUser =
    user.length <= 2 ? user[0] + "***" : user[0] + "***" + user[user.length - 1];
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0] ? domainParts[0][0] + "***" : "s***";
  const tld = domainParts.slice(1).join(".") || "com";
  return `${maskedUser}@${maskedDomain}.${tld}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Restore local session & subscribe to Firestore user + presence
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;

    // Check localStorage session
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ruvio_auth_user");
      const activeUid = localStorage.getItem("ruvio_active_uid");
      if (stored && activeUid) {
        try {
          const parsed = JSON.parse(stored) as User;
          setUserProfile(parsed);
          setIsLoading(false);

          // Subscribe in real-time to genuine user doc in Firestore
          const userDocRef = doc(db, "users", activeUid);
          unsubscribeDoc = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const updatedProfile: User = {
                id: snap.id,
                name: data.name || parsed.name,
                userNumber: data.userNumber || parsed.userNumber,
                email: data.email || parsed.email,
                avatarUrl: data.avatarUrl || parsed.avatarUrl || "",
                status: (data.status as any) || parsed.status || "online",
                bio: data.bio || parsed.bio || "",
                joinedDate: data.joinedDate || parsed.joinedDate || "2026",
                role: data.role || parsed.role || "member",
                settings: data.settings || parsed.settings,
              };
              setUserProfile(updatedProfile);
              localStorage.setItem("ruvio_auth_user", JSON.stringify(updatedProfile));
            }
          });
        } catch (e) {
          console.warn("Failed to restore session from localStorage:", e);
        }
      }
    }

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const activeUid =
          (typeof window !== "undefined" && localStorage.getItem("ruvio_active_uid")) ||
          fbUser.uid;

        // Presence in Realtime Database
        const connectedRef = rtdbRef(rtdb, ".info/connected");
        const presenceRef = rtdbRef(rtdb, `presence/${activeUid}`);

        unsubscribePresence = onValue(connectedRef, (snapshot) => {
          if (snapshot.val() === true) {
            onDisconnect(presenceRef)
              .set({
                state: "offline",
                lastSeen: rtdbServerTimestamp(),
              })
              .then(() => {
                rtdbSet(presenceRef, {
                  state: "online",
                  lastSeen: rtdbServerTimestamp(),
                });
              })
              .catch(() => {});
          }
        });
      } else {
        if (typeof window !== "undefined" && !localStorage.getItem("ruvio_auth_user")) {
          setUserProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribePresence) unsubscribePresence();
      unsubscribeAuth();
    };
  }, []);

  // 2. Request / Generate OTP for genuine database user
  const sendOtp = async (
    userNumber?: string,
    email?: string
  ): Promise<{ maskedEmail: string; otpCode: string }> => {
    setError(null);
    const cleanNumber = String(userNumber || "").replace(/[^0-9]/g, "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanNumber && !cleanEmail) {
      const msg = "Please enter your 6-digit User Number or email address.";
      setError(msg);
      throw new Error(msg);
    }

    try {
      let userDocId = "";
      let userRecord: any = null;

      // Lookup by userNumber string
      if (cleanNumber) {
        const snap = await getDocs(
          query(collection(db, "users"), where("userNumber", "==", cleanNumber), limit(1))
        );
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          userRecord = snap.docs[0].data();
        }
      }

      // Lookup by userNumber number format
      if (!userRecord && cleanNumber && !isNaN(Number(cleanNumber))) {
        const snap = await getDocs(
          query(collection(db, "users"), where("userNumber", "==", Number(cleanNumber)), limit(1))
        );
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          userRecord = snap.docs[0].data();
        }
      }

      // Lookup by email
      if (!userRecord && (cleanEmail || cleanNumber.includes("@"))) {
        const targetEmail = cleanEmail || cleanNumber.toLowerCase();
        const snap = await getDocs(
          query(collection(db, "users"), where("email", "==", targetEmail), limit(1))
        );
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          userRecord = snap.docs[0].data();
        }
      }

      // Fallback: scan users collection to ensure any created user is detected
      if (!userRecord) {
        const allUsersSnap = await getDocs(collection(db, "users"));
        for (const docSnap of allUsersSnap.docs) {
          const data = docSnap.data();
          const docNum = String(data.userNumber || "").trim();
          const docEmail = String(data.email || "").trim().toLowerCase();
          if (
            (cleanNumber && docNum === cleanNumber) ||
            (cleanEmail && docEmail === cleanEmail) ||
            docSnap.id.substring(0, 6) === cleanNumber
          ) {
            userDocId = docSnap.id;
            userRecord = data;
            break;
          }
        }
      }

      if (!userRecord || !userDocId) {
        const msg = `No user account found for #${cleanNumber || cleanEmail}. Please verify your 6-digit identifier or provision an account in /admin.`;
        setError(msg);
        throw new Error(msg);
      }

      const targetEmail = String(userRecord.email || cleanEmail || "").trim();
      const maskedEmail = maskEmail(targetEmail);

      // Generate 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const lookupKey = cleanNumber || cleanEmail || userDocId;

      // Save to Firestore otps collection
      try {
        await setDoc(doc(db, "otps", lookupKey), {
          identifier: lookupKey,
          userDocId,
          email: targetEmail,
          otp: otpCode,
          debugOtp: otpCode,
          createdAt: serverTimestamp(),
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
      } catch (e) {
        console.warn("Could not write to Firestore otps collection:", e);
      }

      // Persist in client sessionStorage so code is immediately shareable & verifiable
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ruvio_pending_otp_" + lookupKey, otpCode);
        sessionStorage.setItem("ruvio_last_otp", otpCode);
        sessionStorage.setItem("ruvio_last_user_number", lookupKey);
        sessionStorage.setItem("ruvio_pending_email_" + lookupKey, targetEmail);
      }

      console.log(`[Ruvio Auth] Verification code for user #${lookupKey} (${targetEmail}): ${otpCode}`);

      return {
        maskedEmail,
        otpCode,
      };
    } catch (err: any) {
      const message = err?.message || "Failed to dispatch verification code.";
      setError(message);
      throw new Error(message);
    }
  };

  // 3. Verify OTP and sign in
  const verifyOtpAndLogin = async (
    userNumber: string,
    otp: string,
    email?: string
  ): Promise<User> => {
    setError(null);
    const cleanNumber = String(userNumber || "").replace(/[^0-9]/g, "").trim();
    const cleanOtp = String(otp || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const lookupKey = cleanNumber || cleanEmail;

    if (!cleanOtp || cleanOtp.length !== 6) {
      const msg = "Please enter all 6 digits of the verification code.";
      setError(msg);
      throw new Error(msg);
    }

    try {
      // 1. Check OTP against sessionStorage, demo code "123456", or Firestore otps
      let isOtpValid = false;
      const storedOtp =
        typeof window !== "undefined"
          ? sessionStorage.getItem("ruvio_pending_otp_" + lookupKey) ||
            sessionStorage.getItem("ruvio_last_otp")
          : null;

      if (storedOtp && cleanOtp === storedOtp) {
        isOtpValid = true;
      } else if (cleanOtp === "123456") {
        isOtpValid = true;
      } else {
        try {
          const otpDoc = await getDoc(doc(db, "otps", lookupKey));
          if (otpDoc.exists()) {
            const data = otpDoc.data();
            if (data?.otp === cleanOtp || data?.debugOtp === cleanOtp) {
              isOtpValid = true;
            }
          }
        } catch (e) {
          console.warn("Firestore otps check failed:", e);
        }
      }

      if (!isOtpValid) {
        throw new Error("Invalid verification code. Please check the code and try again.");
      }

      // 2. Fetch authentic user record from Firestore
      let userDocId = "";
      let userRecord: any = null;

      if (cleanNumber) {
        const snap = await getDocs(
          query(collection(db, "users"), where("userNumber", "==", cleanNumber), limit(1))
        );
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          userRecord = snap.docs[0].data();
        }
      }

      if (!userRecord && cleanNumber && !isNaN(Number(cleanNumber))) {
        const snap = await getDocs(
          query(collection(db, "users"), where("userNumber", "==", Number(cleanNumber)), limit(1))
        );
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          userRecord = snap.docs[0].data();
        }
      }

      if (!userRecord && (cleanEmail || cleanNumber.includes("@"))) {
        const targetEmail = cleanEmail || cleanNumber.toLowerCase();
        const snap = await getDocs(
          query(collection(db, "users"), where("email", "==", targetEmail), limit(1))
        );
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          userRecord = snap.docs[0].data();
        }
      }

      if (!userRecord) {
        const allUsersSnap = await getDocs(collection(db, "users"));
        for (const docSnap of allUsersSnap.docs) {
          const data = docSnap.data();
          const docNum = String(data.userNumber || "").trim();
          const docEmail = String(data.email || "").trim().toLowerCase();
          if (
            (cleanNumber && docNum === cleanNumber) ||
            (cleanEmail && docEmail === cleanEmail) ||
            docSnap.id.substring(0, 6) === cleanNumber
          ) {
            userDocId = docSnap.id;
            userRecord = data;
            break;
          }
        }
      }

      if (!userRecord || !userDocId) {
        throw new Error(`User account for #${lookupKey} could not be found.`);
      }

      const profile: User = {
        id: userDocId,
        name: userRecord.name || "User",
        userNumber: userRecord.userNumber || cleanNumber,
        email: userRecord.email || cleanEmail || "",
        avatarUrl: userRecord.avatarUrl || "",
        status: "online",
        bio: userRecord.bio || "",
        joinedDate: userRecord.joinedDate || "2026",
        role: userRecord.role || "member",
        settings: userRecord.settings,
      };

      // 3. Store active session
      if (typeof window !== "undefined") {
        localStorage.setItem("ruvio_auth_user", JSON.stringify(profile));
        localStorage.setItem("ruvio_active_uid", userDocId);
        sessionStorage.removeItem("ruvio_pending_otp_" + lookupKey);
      }

      // 4. Try background Firebase anonymous sign-in to keep auth connected
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Firebase Auth sign-in skipped:", authErr);
      }

      // 5. Update RTDB presence
      try {
        const presenceRef = rtdbRef(rtdb, `presence/${userDocId}`);
        await rtdbSet(presenceRef, {
          state: "online",
          lastSeen: rtdbServerTimestamp(),
        });
      } catch (rtdbErr) {
        console.warn("RTDB presence update skipped:", rtdbErr);
      }

      setUserProfile(profile);
      return profile;
    } catch (err: any) {
      const message = err?.message || "Verification failed.";
      setError(message);
      throw new Error(message);
    }
  };

  // 4. Logout
  const logout = async () => {
    const currentUid =
      userProfile?.id ||
      (typeof window !== "undefined" ? localStorage.getItem("ruvio_active_uid") : null);

    if (currentUid) {
      try {
        const presenceRef = rtdbRef(rtdb, `presence/${currentUid}`);
        await rtdbSet(presenceRef, {
          state: "offline",
          lastSeen: rtdbServerTimestamp(),
        }).catch(() => {});
      } catch (e) {}
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("ruvio_auth_user");
      localStorage.removeItem("ruvio_active_uid");
    }
    await signOut(auth).catch(() => {});
    setUserProfile(null);
  };

  // 5. Update Profile
  const updateProfile = async (data: Partial<User>) => {
    const currentUid =
      userProfile?.id ||
      (typeof window !== "undefined" ? localStorage.getItem("ruvio_active_uid") : null);

    if (!currentUid) throw new Error("User not authenticated");
    const userDocRef = doc(db, "users", currentUid);
    await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ruvio_auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem("ruvio_auth_user", JSON.stringify({ ...parsed, ...data }));
        } catch (e) {}
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        isLoading,
        error,
        sendOtp,
        verifyOtpAndLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
