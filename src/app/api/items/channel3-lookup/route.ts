import { NextResponse } from "next/server";
import { lookupReplacementPrice } from "@/lib/channel3";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const result = await lookupReplacementPrice(name);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Channel3 lookup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

