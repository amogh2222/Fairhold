import crypto from "crypto";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * Computes SHA-256 cryptographic hash of photo buffer.
 */
export function computePhotoSha256(buffer: Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export interface UploadPhotoResult {
  storageKey: string;
  url: string;
  sha256: string;
}

/**
 * Upload an inspection photo to S3 (or local persistent fallback).
 */
export async function uploadInspectionPhoto(params: {
  buffer: Buffer;
  mimeType?: string;
  prefix?: string;
}): Promise<UploadPhotoResult> {
  const { buffer, mimeType = "image/jpeg", prefix = "inspections" } = params;
  const sha256 = computePhotoSha256(buffer);
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("svg") ? "svg" : "jpg";
  const storageKey = `${prefix}/${Date.now()}-${sha256.slice(0, 16)}.${ext}`;

  const s3 = getS3Client();
  const bucket = process.env.S3_BUCKET;

  if (s3 && bucket) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: mimeType,
        })
      );

      // Generate signed URL valid for 24 hours
      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucket,
          Key: storageKey,
        }),
        { expiresIn: 86400 }
      );

      return {
        storageKey,
        url: signedUrl,
        sha256,
      };
    } catch (err: any) {
      console.warn("S3 upload failed, falling back to local file storage:", err.message);
    }
  }

  // Local fallback storage
  const uploadDir = path.join(process.cwd(), "public", "uploads", prefix);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${sha256.slice(0, 16)}.${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  return {
    storageKey,
    url: `/uploads/${prefix}/${filename}`,
    sha256,
  };
}
