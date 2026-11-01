import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeBookingSettlement } from "@/lib/settlement";
import { voidAuthorization } from "@/lib/paypal/client";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const body = await req.json().catch(() => ({}));
    const { action = "settle", damageAmount, reason } = body;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        proposal: true,
        authorizations: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (action === "cancel") {
      // Find active auth and void it
      const activeAuth = booking.authorizations?.find(
        (a: any) => a.status === "ACTIVE" || a.status === "CREATED"
      );

      if (activeAuth) {
        await voidAuthorization(activeAuth.paypalAuthId);
        await db.authorizationRecord.update({
          where: { id: activeAuth.id },
          data: { status: "VOIDED" },
        });
      }

      const updated = await transitionBookingStatus({
        bookingId: booking.id,
        toStatus: "CANCELLED",
        actor: "OWNER",
        reason: reason || "Booking cancelled. PayPal authorization voided.",
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // Default: Settle booking
    const finalDamage =
      damageAmount !== undefined
        ? Number(damageAmount)
        : (booking.proposal ? booking.proposal.proposedDamage : 0);

    const result = await executeBookingSettlement({
      bookingId: booking.id,
      damageAmount: finalDamage,
      actor: "OWNER",
      reason: reason || `Settlement triggered with damage charge of \$${finalDamage.toFixed(2)}`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Settlement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

