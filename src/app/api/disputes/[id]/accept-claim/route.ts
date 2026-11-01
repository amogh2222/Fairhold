import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { acceptDisputeClaim } from "@/lib/paypal/client";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { note = "Owner accepted renter claim" } = body;

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    try {
      await acceptDisputeClaim(dispute.paypalDisputeId, note);
    } catch (err: any) {
      console.warn("PayPal accept claim API call:", err.message);
    }

    await db.dispute.update({
      where: { id: dispute.id },
      data: {
        status: "RESOLVED",
      },
    });

    // Settle booking
    await transitionBookingStatus({
      bookingId: dispute.bookingId,
      toStatus: "SETTLED",
      actor: "OWNER",
      reason: `Dispute ${dispute.paypalDisputeId} resolved: owner accepted renter claim`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Accept claim error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
