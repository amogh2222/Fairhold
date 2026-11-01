import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, renterSignature, acknowledgedMarks = [] } = body;

    if (!bookingId || !renterSignature) {
      return NextResponse.json(
        { error: "bookingId and renterSignature (typed full name) are required" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { inspections: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Find checkout inspection
    const checkoutInsp = booking.inspections?.find((i: any) => i.type === "CHECKOUT");
    if (!checkoutInsp) {
      return NextResponse.json({ error: "Checkout inspection not found for booking" }, { status: 400 });
    }

    // Update inspection with renter signature and timestamp
    await db.inspection.update({
      where: { id: checkoutInsp.id },
      data: {
        renterSignature,
        renterSignedAt: new Date(),
        summary: `Baseline condition acknowledged and signed by renter: ${renterSignature}`,
      },
    });

    // Transition state to CHECKED_OUT
    const updated = await transitionBookingStatus({
      bookingId: booking.id,
      toStatus: "CHECKED_OUT",
      actor: "RENTER",
      reason: `Renter acknowledged checkout baseline condition: "${renterSignature}"`,
      payload: {
        renterSignature,
        acknowledgedMarksCount: acknowledgedMarks.length,
        signedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error: any) {
    console.error("Checkout sign error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
