import { NextResponse } from "next/server";
import { uploadInspectionPhoto } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const upload = await uploadInspectionPhoto({
      buffer,
      mimeType: file.type || "image/jpeg",
      prefix: "inspections",
    });

    return NextResponse.json({
      fileUrl: upload.url,
      sha256Hash: upload.sha256,
      storageKey: upload.storageKey,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

