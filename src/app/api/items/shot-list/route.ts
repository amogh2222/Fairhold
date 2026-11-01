import { NextResponse } from "next/server";
import { generateShotList } from "@/lib/ai/shot-list";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, name } = body;

    if (!category || !name) {
      return NextResponse.json({ error: "category and name are required" }, { status: 400 });
    }

    const shots = await generateShotList({ category, name });
    return NextResponse.json({ shots });
  } catch (error: any) {
    console.error("Shot list generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
