import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paypal/client";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);
    const headers = Object.fromEntries(req.headers.entries());

    // Verify signature if WEBHOOK_ID is configured
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      const isValid = await verifyWebhookSignature({
        webhookId,
        authAlgo: headers["paypal-auth-algo"] || "",
        certUrl: headers["paypal-cert-url"] || "",
        transmissionId: headers["paypal-transmission-id"] || "",
        transmissionSig: headers["paypal-transmission-sig"] || "",
        transmissionTime: headers["paypal-transmission-time"] || "",
        webhookEvent: event,
      });

      if (!isValid) {
        console.warn("PayPal webhook signature verification failed.");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }
    const eventId = event.id;
    const eventType = event.event_type;

    // Idempotency check: if event already processed, return 200 immediately
    const existing = await db.webhookEvent.findUnique({
      where: { paypalEventId: eventId },
    });

    if (existing) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // Save webhook event
    await db.webhookEvent.create({
      data: {
        paypalEventId: eventId,
        eventType,
        payload: rawBody,
        status: "PROCESSING",
      },
    });

    const resource = event.resource;

    // Handle event types
    switch (eventType) {
      case "PAYMENT.AUTHORIZATION.CREATED": {
        const authId = resource.id;
        const customId = resource.custom_id;
        if (customId) {
          await db.auditEvent.create({
            data: {
              bookingId: customId,
              eventType: "WEBHOOK_PAYMENT_AUTHORIZATION_CREATED",
              actor: "PAYPAL",
              details: JSON.stringify({ authId, amount: resource.amount?.value }),
            },
          });
        }
        break;
      }

      case "PAYMENT.AUTHORIZATION.VOIDED": {
        const authId = resource.id;
        const authRecord = await db.authorizationRecord.findFirst({
          where: { paypalAuthId: authId },
        });
        if (authRecord) {
          await db.authorizationRecord.update({
            where: { id: authRecord.id },
            data: { status: "VOIDED" },
          });
          await transitionBookingStatus({
            bookingId: authRecord.bookingId,
            toStatus: "CANCELLED",
            actor: "PAYPAL",
            reason: `PayPal authorization ${authId} voided via webhook`,
          });
        }
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        const captureId = resource.id;
        await db.capture.updateMany({
          where: { paypalCaptureId: captureId },
          data: { status: "COMPLETED" },
        });
        break;
      }

      case "CUSTOMER.DISPUTE.CREATED": {
        const disputeId = resource.dispute_id;
        const sellerTxId = resource.disputed_transactions?.[0]?.seller_transaction_id;

        if (sellerTxId) {
          const capture = await db.capture.findUnique({
            where: { paypalCaptureId: sellerTxId },
          });

          if (capture) {
            await db.dispute.create({
              data: {
                bookingId: capture.bookingId,
                paypalDisputeId: disputeId,
                status: resource.status || "OPEN",
                reason: resource.reason || "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
                disputeAmount: parseFloat(resource.dispute_amount?.value || "0"),
                currency: resource.dispute_amount?.currency_code || "USD",
                rawPayload: JSON.stringify(resource),
              },
            });

            await transitionBookingStatus({
              bookingId: capture.bookingId,
              toStatus: "DISPUTED",
              actor: "PAYPAL",
              reason: `Dispute ${disputeId} created via webhook for capture ${sellerTxId}`,
            });
          }
        }
        break;
      }

      case "CUSTOMER.DISPUTE.RESOLVED": {
        const disputeId = resource.dispute_id;
        const dispute = await db.dispute.findUnique({
          where: { paypalDisputeId: disputeId },
        });

        if (dispute) {
          await db.dispute.update({
            where: { id: dispute.id },
            data: { status: "RESOLVED", rawPayload: JSON.stringify(resource) },
          });

          await transitionBookingStatus({
            bookingId: dispute.bookingId,
            toStatus: "SETTLED",
            actor: "PAYPAL",
            reason: `Dispute ${disputeId} resolved: outcome ${resource.dispute_outcome?.outcome_code || "CLOSED"}`,
          });
        }
        break;
      }
    }

    // Mark webhook event processed
    await db.webhookEvent.update({
      where: { paypalEventId: eventId },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
