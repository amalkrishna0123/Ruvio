"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockUser = exports.reportUser = exports.onMessageCreated = exports.deleteMedia = exports.uploadMedia = exports.getCloudinarySignature = exports.verifyOtp = exports.requestOtp = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const admin = __importStar(require("firebase-admin"));
const cloudinary_1 = require("cloudinary");
const crypto = __importStar(require("crypto"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Configure Cloudinary from secure credentials / environment variable
const CLOUDINARY_URL = process.env.CLOUDINARY_URL ||
    "cloudinary://451769685713455:DjMoseo60h0VD123QKbHqwSvia0@dftnwl0vw";
cloudinary_1.v2.config({
    cloud_name: "dftnwl0vw",
    api_key: "451769685713455",
    api_secret: "DjMoseo60h0VD123QKbHqwSvia0",
    secure: true,
});
// Helper: Hash OTP with salt
function hashOtp(otp, salt) {
    return crypto.createHmac("sha256", salt).update(otp).digest("hex");
}
// Helper: Mask email for privacy display
function maskEmail(email) {
    const [user, domain] = email.split("@");
    if (!user || !domain)
        return email;
    const maskedUser = user.length <= 2 ? user[0] + "***" : user[0] + "***" + user[user.length - 1];
    const [domainName, tld] = domain.split(".");
    const maskedDomain = domainName ? domainName[0] + "***" : "s***";
    return `${maskedUser}@${maskedDomain}.${tld || "io"}`;
}
// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION & CUSTOM EMAIL OTP (GENUINE DATA ONLY)
// ─────────────────────────────────────────────────────────────────────────────
exports.requestOtp = (0, https_1.onCall)(async (request) => {
    const data = request.data || {};
    const userNumber = String(data.userNumber || "").trim();
    const emailInput = String(data.email || "").trim().toLowerCase();
    if (!userNumber && !emailInput) {
        throw new https_1.HttpsError("invalid-argument", "Please enter a valid 6-digit User Number or email address.");
    }
    // Look up genuine user in Firestore
    let userRecord = null;
    let userDocId = "";
    if (userNumber) {
        const snap = await db
            .collection("users")
            .where("userNumber", "==", userNumber)
            .limit(1)
            .get();
        if (!snap.empty) {
            userDocId = snap.docs[0].id;
            userRecord = snap.docs[0].data();
        }
    }
    else if (emailInput) {
        const snap = await db
            .collection("users")
            .where("email", "==", emailInput)
            .limit(1)
            .get();
        if (!snap.empty) {
            userDocId = snap.docs[0].id;
            userRecord = snap.docs[0].data();
        }
    }
    if (!userRecord || !userDocId) {
        throw new https_1.HttpsError("not-found", `No user account found for #${userNumber || emailInput}. Please verify your identifier or provision an account.`);
    }
    const targetEmail = userRecord.email;
    if (!targetEmail) {
        throw new https_1.HttpsError("failed-precondition", "User record has no registered email address for verification.");
    }
    const lookupKey = userNumber || emailInput;
    const otpRef = db.collection("otps").doc(lookupKey);
    const existingOtpDoc = await otpRef.get();
    const now = Date.now();
    if (existingOtpDoc.exists) {
        const existing = existingOtpDoc.data();
        if (existing?.lastRequestedAt) {
            const elapsedMs = now - existing.lastRequestedAt.toMillis();
            if (elapsedMs < 15000) {
                throw new https_1.HttpsError("resource-exhausted", "Please wait 15 seconds before requesting another verification code.");
            }
            if (existing.requestCount >= 5 && elapsedMs < 15 * 60 * 1000) {
                throw new https_1.HttpsError("resource-exhausted", "Too many verification attempts. Please wait 15 minutes before trying again.");
            }
        }
    }
    const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedCode = hashOtp(otpCode, salt);
    const expiresAt = now + 10 * 60 * 1000;
    await otpRef.set({
        identifier: lookupKey,
        userDocId,
        email: targetEmail,
        otpHash: hashedCode,
        salt,
        expiresAt: admin.firestore.Timestamp.fromMillis(expiresAt),
        lastRequestedAt: admin.firestore.Timestamp.fromMillis(now),
        requestCount: admin.firestore.FieldValue.increment(1),
        attempts: 0,
        debugOtp: otpCode,
    });
    firebase_functions_1.logger.info(`[Auth OTP] Dispatched code for ${targetEmail} (UID: ${userDocId}): ${otpCode}`);
    return {
        success: true,
        maskedEmail: maskEmail(targetEmail),
        expiresInSeconds: 600,
        debugOtp: otpCode,
    };
});
exports.verifyOtp = (0, https_1.onCall)(async (request) => {
    const data = request.data || {};
    const userNumber = String(data.userNumber || "").trim();
    const emailInput = String(data.email || "").trim().toLowerCase();
    const code = String(data.otp || "").trim();
    if (!code || code.length !== 6) {
        throw new https_1.HttpsError("invalid-argument", "Please enter the complete 6-digit verification code.");
    }
    const lookupKey = userNumber || emailInput;
    if (!lookupKey) {
        throw new https_1.HttpsError("invalid-argument", "User identifier is required.");
    }
    const otpRef = db.collection("otps").doc(lookupKey);
    const otpDoc = await otpRef.get();
    if (!otpDoc.exists) {
        throw new https_1.HttpsError("not-found", "No active verification code found. Please request a new code.");
    }
    const otpData = otpDoc.data();
    const now = Date.now();
    const expiresAt = otpData.expiresAt.toMillis();
    if (now > expiresAt) {
        await otpRef.delete().catch(() => { });
        throw new https_1.HttpsError("deadline-exceeded", "Verification code has expired. Please request a new code.");
    }
    if (otpData.attempts >= 5) {
        await otpRef.delete().catch(() => { });
        throw new https_1.HttpsError("permission-denied", "Too many incorrect attempts. Please request a new code.");
    }
    const calculatedHash = hashOtp(code, otpData.salt);
    if (calculatedHash !== otpData.otpHash && code !== otpData.debugOtp) {
        await otpRef.update({
            attempts: admin.firestore.FieldValue.increment(1),
        });
        throw new https_1.HttpsError("invalid-argument", "Invalid verification code. Please try again.");
    }
    // Clear OTP upon success
    await otpRef.delete().catch(() => { });
    // Fetch actual user profile
    const userDoc = await db.collection("users").doc(otpData.userDocId).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError("not-found", "User record could not be found.");
    }
    const userProfile = userDoc.data();
    // Generate Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(userDoc.id, {
        userNumber: userProfile.userNumber,
        role: userProfile.role || "member",
    });
    return {
        success: true,
        customToken,
        user: {
            id: userDoc.id,
            ...userProfile,
        },
    };
});
// ─────────────────────────────────────────────────────────────────────────────
// 2. CLOUDINARY MEDIA UPLOAD AUTHORIZATION & MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
exports.getCloudinarySignature = (0, https_1.onCall)((request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to authorize media uploads.");
    }
    const data = request.data || {};
    const folder = String(data.folder || "whatsapp/media").trim();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const resourceType = data.resourceType || "auto";
    const paramsToSign = {
        folder,
        timestamp,
    };
    const signature = cloudinary_1.v2.utils.api_sign_request(paramsToSign, "DjMoseo60h0VD123QKbHqwSvia0");
    return {
        signature,
        timestamp,
        apiKey: "451769685713455",
        cloudName: "dftnwl0vw",
        folder,
        resourceType,
    };
});
exports.uploadMedia = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to upload media.");
    }
    const data = request.data || {};
    const fileData = data.fileData;
    const folder = String(data.folder || "whatsapp/media");
    const resourceType = data.resourceType || "auto";
    if (!fileData) {
        throw new https_1.HttpsError("invalid-argument", "No file payload provided for upload.");
    }
    try {
        const uploadResult = await cloudinary_1.v2.uploader.upload(fileData, {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
        });
        return {
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            resourceType: uploadResult.resource_type,
            duration: uploadResult.duration,
            width: uploadResult.width,
            height: uploadResult.height,
        };
    }
    catch (error) {
        firebase_functions_1.logger.error("Cloudinary upload failed:", error);
        throw new https_1.HttpsError("internal", error?.message || "Failed to upload media asset to Cloudinary.");
    }
});
exports.deleteMedia = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required to delete media.");
    }
    const data = request.data || {};
    const publicId = String(data.publicId || "").trim();
    const resourceType = data.resourceType || "image";
    if (!publicId) {
        throw new https_1.HttpsError("invalid-argument", "publicId is required to delete media.");
    }
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return { success: true, result };
    }
    catch (err) {
        firebase_functions_1.logger.error("Failed to delete Cloudinary media:", err);
        throw new https_1.HttpsError("internal", err.message);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 3. MESSAGING, DELIVERY & NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
exports.onMessageCreated = (0, firestore_1.onDocumentCreated)("conversations/{conversationId}/messages/{messageId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const message = snap.data();
    const { conversationId, messageId } = event.params;
    const convRef = db.collection("conversations").doc(conversationId);
    const convSnap = await convRef.get();
    if (!convSnap.exists)
        return;
    const convData = convSnap.data();
    await convRef.update({
        "lastMessage.text": message.content || (message.attachment ? "Attachment" : "Media"),
        "lastMessage.timestamp": message.timestamp || "Just Now",
        "lastMessage.isOutgoing": false,
        "lastMessage.status": "sent",
        "lastMessage.hasPhotoMedia": !!(message.photosStack?.length || message.attachment?.type === "image"),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const participants = convData.participantIds || (convData.participant?.id ? [convData.participant.id] : []);
    for (const pId of participants) {
        if (pId !== message.senderId) {
            const userDoc = await db.collection("users").doc(pId).get();
            const fcmTokens = userDoc.data()?.fcmTokens;
            if (Array.isArray(fcmTokens) && fcmTokens.length > 0) {
                const payload = {
                    tokens: fcmTokens,
                    notification: {
                        title: message.senderName || "New Encrypted Message",
                        body: message.content || "Sent an attachment",
                    },
                    data: {
                        conversationId,
                        messageId,
                        type: "message",
                    },
                };
                await admin.messaging().sendEachForMulticast(payload).catch((e) => {
                    firebase_functions_1.logger.warn("FCM multicast error:", e);
                });
            }
        }
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// 4. USER MODERATION & REPORTING
// ─────────────────────────────────────────────────────────────────────────────
exports.reportUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required to submit reports.");
    }
    const data = request.data || {};
    const reportedUserId = String(data.reportedUserId || "");
    const reason = String(data.reason || "Inappropriate behavior");
    const details = String(data.details || "");
    if (!reportedUserId) {
        throw new https_1.HttpsError("invalid-argument", "reportedUserId is required.");
    }
    const reportRef = await db.collection("reports").add({
        reporterId: request.auth.uid,
        reportedUserId,
        reason,
        details,
        status: "pending_review",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, reportId: reportRef.id };
});
exports.blockUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required to block user.");
    }
    const data = request.data || {};
    const uid = request.auth.uid;
    const targetUserId = String(data.targetUserId || "");
    const block = data.block !== false;
    if (!targetUserId) {
        throw new https_1.HttpsError("invalid-argument", "targetUserId is required.");
    }
    const userRef = db.collection("users").doc(uid);
    if (block) {
        await userRef.update({
            blockedUsers: admin.firestore.FieldValue.arrayUnion(targetUserId),
        });
    }
    else {
        await userRef.update({
            blockedUsers: admin.firestore.FieldValue.arrayRemove(targetUserId),
        });
    }
    return { success: true, blocked: block };
});
//# sourceMappingURL=index.js.map