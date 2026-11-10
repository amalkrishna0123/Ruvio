export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format?: string;
  bytes?: number;
  resourceType?: string;
  duration?: number;
  width?: number;
  height?: number;
  fileName?: string;
}

const CLOUD_NAME = "dftnwl0vw";
const API_KEY = "451769685713455";
const API_SECRET = "DjMoseo60h0VD123QKbHqwSvia0";

// Helper: Generate HMAC SHA-1 upload signature using Web Crypto API
async function generateSignature(folder: string): Promise<{
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const enc = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest("SHA-1", enc.encode(stringToSign));
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return {
      signature,
      timestamp,
      apiKey: API_KEY,
      cloudName: CLOUD_NAME,
      folder,
    };
  }

  // Node environment fallback
  const crypto = await import("crypto");
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");
  return {
    signature,
    timestamp,
    apiKey: API_KEY,
    cloudName: CLOUD_NAME,
    folder,
  };
}

/**
 * Securely uploads a file (Image, Video, Audio, or Document) to Cloudinary.
 * Generates an HMAC SHA-1 signature and posts directly to Cloudinary.
 * Falls back to Next.js /api/upload if client-side fetch is blocked.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "whatsapp/media"
): Promise<CloudinaryUploadResult> {
  try {
    // 1. Generate secure signed authorization
    const { signature, timestamp, apiKey, cloudName } = await generateSignature(folder);

    // 2. Dispatch genuine media file payload directly to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Direct Cloudinary upload error: ${errText}`);
    }

    const data = await res.json();

    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
      resourceType: data.resource_type,
      duration: data.duration,
      width: data.width,
      height: data.height,
      fileName: file.name,
    };
  } catch (err: any) {
    console.warn("Direct Cloudinary upload failed, using /api/upload fallback:", err?.message || err);

    // 3. Fallback: upload through Next.js server route
    const fallbackFormData = new FormData();
    fallbackFormData.append("file", file);
    fallbackFormData.append("folder", folder);

    const fallbackRes = await fetch("/api/upload", {
      method: "POST",
      body: fallbackFormData,
    });

    if (!fallbackRes.ok) {
      const fallbackErr = await fallbackRes.text();
      throw new Error(`Media upload failed: ${fallbackErr}`);
    }

    const data = await fallbackRes.json();
    return {
      url: data.url,
      publicId: data.publicId,
      format: data.format,
      bytes: data.bytes,
      resourceType: data.resourceType,
      duration: data.duration,
      width: data.width,
      height: data.height,
      fileName: file.name,
    };
  }
}

/**
 * Uploads a recorded audio voice note (Blob) to Cloudinary
 */
export async function uploadVoiceNoteToCloudinary(
  audioBlob: Blob,
  durationSec?: number
): Promise<CloudinaryUploadResult> {
  const file = new File([audioBlob], `voice_${Date.now()}.webm`, {
    type: audioBlob.type || "audio/webm",
  });
  const res = await uploadToCloudinary(file, "whatsapp/voice_notes");
  if (durationSec) {
    res.duration = durationSec;
  }
  return res;
}

/**
 * Deletes a Cloudinary asset
 */
export async function deleteCloudinaryMedia(
  publicId: string,
  resourceType: string = "image"
): Promise<boolean> {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;

    let signature = "";
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const enc = new TextEncoder();
      const hashBuffer = await window.crypto.subtle.digest("SHA-1", enc.encode(stringToSign));
      signature = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      const crypto = await import("crypto");
      signature = crypto.createHash("sha1").update(stringToSign).digest("hex");
    }

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`, {
      method: "POST",
      body: formData,
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to delete Cloudinary media:", err);
    return false;
  }
}
