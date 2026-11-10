import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = "dftnwl0vw";
const API_KEY = "451769685713455";
const API_SECRET = "DjMoseo60h0VD123QKbHqwSvia0";

export async function POST(req: NextRequest) {
  try {
    const incomingFormData = await req.formData();
    const file = incomingFormData.get("file") as File | null;
    const folder = (incomingFormData.get("folder") as string) || "whatsapp/media";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("api_key", API_KEY);
    cloudinaryFormData.append("timestamp", String(timestamp));
    cloudinaryFormData.append("signature", signature);
    cloudinaryFormData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      url: data.secure_url || data.url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
      resourceType: data.resource_type,
      duration: data.duration,
      width: data.width,
      height: data.height,
      fileName: file.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}

