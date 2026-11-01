import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reauthorizePayment } from "@/lib/paypal/client";
import { requiresReauthorizationBeforeCapture } from "@/lib/timing";

export async function GET(req: Request) {
  try {
    const bookings = await db.booking.findMany({
      where: {
        status: "CHECKED_OUT",
      },
      include: {
        authorizations: true,
      },
    });

    const reauthorized = [];

    for (const booking of bookings) {
      const activeAuth = booking.authorizations?.find(
        (a: any) => a.status === "ACTIVE" || a.status === "CREATED"
      );

      if (!activeAuth) continue;

      const honorEnds = new Date(activeAuth.honorEndsAt);
      if (requiresReauthorizationBeforeCapture(honorEnds)) {
        try {
          const result = await reauthorizePayment(
            activeAuth.paypalAuthId,
            activeAuth.amount,
            activeAuth.currency
          );

          await db.authorizationRecord.update({
            where: { id: activeAuth.id },
            data: { status: "REAUTHORIZED" },
          });

          await db.authorizationRecord.create({
            data: {
              bookingId: booking.id,
              paypalOrderId: activeAuth.paypalOrderId,
              paypalAuthId: result.authorizationId,
              amount: result.amount,
              currency: result.currency,
              status: "ACTIVE",
              honorEndsAt: result.honorEndsAt,
              expiresAt: result.expiresAt,
            },
          });

          reauthorized.push({
            bookingId: booking.id,
            newAuthId: result.authorizationId,
          });
        } catch (err: any) {
          console.warn(`Reauthorization error for booking ${booking.id}:`, err.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checkedCount: bookings.length,
      reauthorizedCount: reauthorized.length,
      reauthorized,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
