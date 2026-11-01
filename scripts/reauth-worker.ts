import { db } from "../src/lib/db";
import { reauthorizePayment } from "../src/lib/paypal/client";
import { requiresReauthorizationBeforeCapture } from "../src/lib/timing";

async function runReauthorizationJob() {
  console.log("[Worker] Starting scheduled PayPal reauthorization check...");

  try {
    const bookings = await db.booking.findMany({
      where: {
        status: "CHECKED_OUT",
      },
      include: {
        authorizations: true,
      },
    });

    console.log(`[Worker] Found ${bookings.length} active rental(s) in field.`);

    for (const booking of bookings) {
      const activeAuth = booking.authorizations?.find(
        (a: any) => a.status === "ACTIVE" || a.status === "CREATED"
      );

      if (!activeAuth) continue;

      const honorEnds = new Date(activeAuth.honorEndsAt);
      if (requiresReauthorizationBeforeCapture(honorEnds)) {
        console.log(`[Worker] Reauthorizing booking ${booking.id} (Auth: ${activeAuth.paypalAuthId})...`);
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

          console.log(`[Worker] Successfully reauthorized! New Auth ID: ${result.authorizationId}`);
        } catch (err: any) {
          console.error(`[Worker] Reauthorization failed for booking ${booking.id}:`, err.message);
        }
      }
    }

    console.log("[Worker] Reauthorization check completed.");
  } catch (error: any) {
    console.error("[Worker] Fatal error in reauthorization worker:", error);
  }
}

runReauthorizationJob();
