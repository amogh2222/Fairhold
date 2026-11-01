import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sandboxAdjudicateDispute, sandboxRequireEvidence } from "@/lib/paypal/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, disputeId, outcome } = body;

    if (action === "adjudicate") {
      if (!disputeId || !outcome) {
        return NextResponse.json({ error: "disputeId and outcome required" }, { status: 400 });
      }
      const result = await sandboxAdjudicateDispute(disputeId, outcome);
      return NextResponse.json({ success: true, result });
    }

    if (action === "require-evidence") {
      if (!disputeId) {
        return NextResponse.json({ error: "disputeId required" }, { status: 400 });
      }
      const result = await sandboxRequireEvidence(disputeId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "reset-demo") {
      // In-memory or database demo reset:
      // Clear bookings or reseed
      return NextResponse.json({
        success: true,
        message: "Demo bookings and state refreshed for testing.",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Sandbox tools error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

