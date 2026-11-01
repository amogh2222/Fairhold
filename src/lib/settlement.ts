import { db } from "./db";
import {
  captureAuthorization,
  reauthorizePayment,
  voidAuthorization,
} from "./paypal/client";
import { requiresReauthorizationBeforeCapture } from "./timing";
import { transitionBookingStatus } from "./state-machine";

export interface SettleBookingResult {
  success: boolean;
  captureId?: string;
  totalCaptured: number;
  totalReleased: number;
  reauthorized: boolean;
  bookingStatus: string;
}

/**
 * Executes final settlement on a booking according to Fairhold Principles P1 & P5:
 * 1. Checks just-in-time if reauthorization is required.
 * 2. If capture amount > 0, executes ONE capture with final_capture=true (releasing the rest).
 * 3. If capture amount == 0, voids the authorization (releasing 100%).
 * 4. Records Captures, updates Authorization, updates proposal, transitions booking to SETTLED.
 */
export async function executeBookingSettlement(params: {
  bookingId: string;
  damageAmount: number;
  actor: "RENTER" | "OWNER" | "SYSTEM";
  reason?: string;
}): Promise<SettleBookingResult> {
  const { bookingId, damageAmount, actor, reason } = params;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      authorizations: true,
      proposal: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  // Find active authorization
  const activeAuth = booking.authorizations?.find(
    (a: any) => a.status === "ACTIVE" || a.status === "CREATED"
  );

  if (!activeAuth) {
    throw new Error(`No active authorization found for booking ${bookingId}`);
  }

  let authorizationId = activeAuth.paypalAuthId;
  let reauthorized = false;

  // Principle: Just-in-time reauthorization if honor period expired or about to expire
  if (requiresReauthorizationBeforeCapture(new Date(activeAuth.honorEndsAt))) {
    console.log(`Honor period expired for auth ${authorizationId}. Executing reauthorization.`);
    const reauthResult = await reauthorizePayment(authorizationId, activeAuth.amount, activeAuth.currency);
    authorizationId = reauthResult.authorizationId;
    reauthorized = true;

    // Mark previous auth reauthorized and record new one
    await db.authorizationRecord.update({
      where: { id: activeAuth.id },
      data: { status: "REAUTHORIZED" },
    });

    await db.authorizationRecord.create({
      data: {
        bookingId: booking.id,
        paypalOrderId: activeAuth.paypalOrderId,
        paypalAuthId: authorizationId,
        amount: reauthResult.amount,
        currency: reauthResult.currency,
        status: "ACTIVE",
        honorEndsAt: reauthResult.honorEndsAt,
        expiresAt: reauthResult.expiresAt,
      },
    });

    await db.auditEvent.create({
      data: {
        bookingId: booking.id,
        eventType: "PAYPAL_REAUTHORIZED",
        actor: "SYSTEM",
        details: JSON.stringify({
          previousAuthId: activeAuth.paypalAuthId,
          newAuthId: authorizationId,
          newHonorEndsAt: reauthResult.honorEndsAt.toISOString(),
        }),
      },
    });
  }

  // Single capture at return strategy:
  // totalToCapture = rental fee + damage
  // If rental fee was already captured separately, totalToCapture = damage.
  // Here, following the hackathon brief:
  // "Capture fee only: capture the rental fee, release deposit." or
  // "Damage charged: capture rental fee + damage, release remaining deposit."
  const totalToCapture = Math.round((booking.rentalFee + damageAmount) * 100) / 100;
  const totalHeld = activeAuth.amount;
  const totalReleased = Math.max(0, Math.round((totalHeld - totalToCapture) * 100) / 100);

  let captureId: string | undefined;

  if (totalToCapture > 0) {
    // Capture in ONE call with final_capture: true
    const captureResult = await captureAuthorization({
      authorizationId,
      amount: totalToCapture,
      currency: activeAuth.currency || "USD",
      finalCapture: true,
    });

    captureId = captureResult.captureId;

    // Record capture in DB
    await db.capture.create({
      data: {
        bookingId: booking.id,
        paypalCaptureId: captureResult.captureId,
        amount: totalToCapture,
        currency: activeAuth.currency || "USD",
        feeAmount: booking.rentalFee,
        damageAmount: damageAmount,
        status: "COMPLETED",
        finalCapture: true,
        rawPayload: JSON.stringify(captureResult.raw || {}),
      },
    });

    // Update active auth record to CAPTURED
    await db.authorizationRecord.update({
      where: { id: activeAuth.id },
      data: { status: "CAPTURED" },
    });
  } else {
    // Zero amount to capture: void the full authorization to release 100% of held deposit
    await voidAuthorization(authorizationId);

    await db.authorizationRecord.update({
      where: { id: activeAuth.id },
      data: { status: "VOIDED" },
    });
  }

  // Update proposal status if exists
  if (booking.proposal) {
    await db.settlementProposal.update({
      where: { id: booking.proposal.id },
      data: { status: "ACCEPTED_BY_RENTER", renterDecidedAt: new Date() },
    });
  }

  // Transition booking to SETTLED
  const updatedBooking = await transitionBookingStatus({
    bookingId: booking.id,
    toStatus: "SETTLED",
    actor,
    reason:
      reason ||
      `Settlement finalized: \$${totalToCapture.toFixed(2)} captured (\$${booking.rentalFee.toFixed(2)} fee + \$${damageAmount.toFixed(2)} damage), \$${totalReleased.toFixed(2)} released.`,
    payload: {
      captureId,
      totalCaptured: totalToCapture,
      totalReleased,
      damageAmount,
      reauthorized,
    },
  });

  return {
    success: true,
    captureId,
    totalCaptured: totalToCapture,
    totalReleased,
    reauthorized,
    bookingStatus: updatedBooking.status,
  };
}

