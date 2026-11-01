import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeOrder } from "@/lib/paypal/client";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, bookingId } = body;

    if (!orderId || !bookingId) {
      return NextResponse.json({ error: "orderId and bookingId are required" }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Call PayPal REST API to authorize the order
    const authResult = await authorizeOrder(orderId);

    // Save AuthorizationRecord
    const authRecord = await db.authorizationRecord.create({
      data: {
        bookingId: booking.id,
        paypalOrderId: orderId,
        paypalAuthId: authResult.authorizationId,
        amount: authResult.amount,
        currency: authResult.currency || "USD",
        status: "ACTIVE",
        honorEndsAt: authResult.honorEndsAt,
        expiresAt: authResult.expiresAt,
        rawPayload: JSON.stringify(authResult.raw || {}),
      },
    });

    // Transition booking state to HELD
    const updatedBooking = await transitionBookingStatus({
      bookingId: booking.id,
      toStatus: "HELD",
      actor: "RENTER",
      reason: `PayPal authorization ${authResult.authorizationId} created for \$${authResult.amount.toFixed(2)}`,
      payload: {
        paypalOrderId: orderId,
        paypalAuthId: authResult.authorizationId,
        honorEndsAt: authResult.honorEndsAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      authorization: authRecord,
      renterToken: booking.renterToken,
    });
  } catch (error: any) {
    console.error("PayPal authorize error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

