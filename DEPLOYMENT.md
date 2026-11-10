# WhatsApp / Ruvio - Firebase Production Backend & Deployment Guide

This project is a production-grade, end-to-end encrypted messaging application built with **Next.js (App Router)**, **Firebase** (Cloud Firestore, Realtime Database, Authentication Custom Tokens, Firebase Cloud Functions v2 in TypeScript), and **Cloudinary** for all media assets.

> **STRICT ARCHITECTURE PRINCIPLES:**
> - **Real Data Only:** Zero mock data, dummy records, or hardcoded fallbacks. All user profiles, conversations, messages, workspace files, and call histories originate exclusively from authenticated backend data.
> - **Zero Firebase Storage:** Firebase Storage is completely bypassed and uninitialized. All media files (photos, voice recordings, documents) are stored on Cloudinary via secure server-side authorization. Firestore stores references and metadata only.

---

## 1. Architecture Overview

```
                                ┌────────────────────────┐
                                │     Next.js Client     │
                                │ (React 19, Tailwind 4) │
                                └───────────┬────────────┘
                                            │
                ┌───────────────────────────┼───────────────────────────┐
                ▼                           ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
    │     Firebase Auth     │   │    Cloud Firestore    │   │   Realtime Database   │
    │  Custom Token Sign-In │   │  Users, Conversations │   │   Online Presence,    │
    │   (Email 6-digit OTP) │   │  Messages, Projects   │   │   Last Seen, Typing,  │
    │                       │   │  Call Logs, Metadata  │   │   WebRTC Signaling    │
    └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
                ▲                           ▲                           ▲
                │                           │                           │
                └───────────────────────────┼───────────────────────────┘
                                            │
                                ┌───────────┴────────────┐
                                │ Firebase Cloud Funcs   │
                                │ (Node.js + TypeScript) │
                                └───────────┬────────────┘
                                            │ HMAC SHA-1 Signed Uploads
                                            ▼
                                ┌────────────────────────┐
                                │       Cloudinary       │
                                │ (dftnwl0vw Cloud Env)  │
                                └────────────────────────┘
```

---

## 2. Firebase Configuration

Client configuration configured in `Whatsapp/lib/firebase/config.ts`:
- **Project ID**: `whatsapp-61eaa`
- **Auth Domain**: `whatsapp-61eaa.firebaseapp.com`
- **Database URL**: `https://whatsapp-61eaa-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Storage Bucket**: *None (Bypassed in favor of Cloudinary)*

---

## 3. Cloudinary Configuration

- **Cloud Name**: `dftnwl0vw`
- **API Key**: `451769685713455`
- **Environment Variable**: `CLOUDINARY_URL=cloudinary://451769685713455:DjMoseo60h0VD123QKbHqwSvia0@dftnwl0vw`

### Secure Media Flow:
1. Client selects an image, document, or records a voice note.
2. Client requests signed authorization parameters from Cloud Function `getCloudinarySignature`.
3. Client dispatches the payload directly to Cloudinary (`https://api.cloudinary.com/v1_1/dftnwl0vw/auto/upload`).
4. The Cloudinary API Secret is **never exposed** to client code.
5. Cloudinary returns the secure URL and public ID, which are stored in Firestore.
6. Asset deletions are handled through the authenticated `deleteMedia` Cloud Function.

---

## 4. Cloud Functions Backend (`functions/`)

Implemented in `Whatsapp/functions/src/index.ts` using Firebase Functions v2:

| Function | Type | Description |
|---|---|---|
| `requestOtp` | Callable | Checks registered user, enforces rate limiting (15s cooldown, max 5 per 15m), hashes 6-digit code with salt, stores expiration in `otps/{identifier}`. |
| `verifyOtp` | Callable | Validates 6-digit OTP against salted hash, burns code upon success, generates custom Firebase Auth Token using Admin SDK. |
| `getCloudinarySignature` | Callable | Authenticated endpoint generating HMAC SHA-1 signatures for secure direct-to-Cloudinary client uploads. |
| `uploadMedia` | Callable | Server-side upload handler for base64 payloads and voice notes. |
| `deleteMedia` | Callable | Destroys Cloudinary assets and clears references. |
| `onMessageCreated` | Firestore Trigger | Updates parent conversation `lastMessage` and triggers FCM push notifications to other participants. |
| `reportUser` | Callable | Stores user moderation reports in Firestore `reports` collection. |
| `blockUser` | Callable | Adds/removes target user from authenticated user's `blockedUsers` list. |

---

## 5. Deployment Instructions

### Prerequisites
1. Install Firebase CLI globally if not already present:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to Firebase:
   ```bash
   firebase login
   ```
3. Set active Firebase project:
   ```bash
   firebase use whatsapp-61eaa
   ```

### Deploying Security Rules & Database Indexes
From `Whatsapp/`:
```bash
firebase deploy --only firestore:rules,firestore:indexes,database
```

### Deploying Cloud Functions
From `Whatsapp/`:
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Building & Deploying the Next.js Frontend
```bash
cd Whatsapp
npm run build
npm run start
```

---

## 6. Verification & Testing Checklist

1. **User Provisioning:**
   - Navigate to `/admin/users/create` to create a new user with name, email, and auto-generated 6-digit User Number.
2. **Authentication:**
   - Navigate to `/login` or `/` and enter the 6-digit User Number.
   - Click *Send One-Time Code*.
   - Retrieve code from Cloud Function log or email.
   - Enter code on `/verify-otp`. Upon verification, the user is authenticated via Custom Token and redirected to `/home`.
3. **Presence & Last Seen:**
   - While logged in, open Firebase Realtime Database console to see `presence/{uid}` set to `state: "online"`.
   - Close or disconnect the tab to see `state: "offline"` with accurate `lastSeen` timestamp.
4. **Connecting Contacts:**
   - Navigate to `/connect` and search by another user's 6-digit number.
   - Click *Add Connection* to establish a mutual contact and conversation channel.
5. **Real-time Messaging & Media:**
   - Open `/chat/[conversationId]`.
   - Send text messages.
   - Click the attachment icon to select a photo or document; verify upload to Cloudinary and immediate appearance in chat with genuine Cloudinary URL.
   - Record a voice note; verify audio playback and Cloudinary storage.
6. **WebRTC Calling:**
   - Launch an audio or video call by clicking the phone/video icon in chat or via `/calls`.
   - Verify camera/microphone stream activation and Realtime Database signaling.
7. **Workspace Collaboration:**
   - Create a project on `/projects/create`.
   - Upload project files on `/projects/[projectId]/files` to verify Cloudinary document hosting.
   - Add collaborators on `/projects/[projectId]/members`.

