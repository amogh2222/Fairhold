import { NextResponse } from "next/server";
import { analyzePhotoQuality } from "@/lib/ai/photo-qa";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photoUrl, shotKey, expectedAngle } = body;

    if (!photoUrl) {
      return NextResponse.json({ error: "photoUrl is required" }, { status: 400 });
    }

    const qaResult = await analyzePhotoQuality({
      photoUrl,
      shotKey: shotKey || "shot_general",
      expectedAngle: expectedAngle || "Direct front angle",
    });

    return NextResponse.json(qaResult);
  } catch (error: any) {
    console.error("Photo QA error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

