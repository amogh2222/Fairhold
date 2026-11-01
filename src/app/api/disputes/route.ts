import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listDisputes } from "@/lib/paypal/client";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function GET() {
  try {
    const disputes = await db.dispute.findMany({
      include: {
        booking: {
          include: {
            item: true,
            captures: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Sync with PayPal sandbox disputes API
    let ppDisputes: any[] = [];
    try {
      const data = await listDisputes();
      ppDisputes = data.items || [];
    } catch (e: any) {
      console.warn("Could not fetch remote disputes:", e.message);
    }

    const synced = [];

    for (const d of ppDisputes) {
      // Find matching capture
      const sellerTxId = d.disputed_transactions?.[0]?.seller_transaction_id;
      if (!sellerTxId) continue;

      const capture = await db.capture.findUnique({
        where: { paypalCaptureId: sellerTxId },
      });

      if (!capture) continue;

      const existingDispute = await db.dispute.findUnique({
        where: { paypalDisputeId: d.dispute_id },
      });

      if (!existingDispute) {
        const created = await db.dispute.create({
          data: {
            bookingId: capture.bookingId,
            paypalDisputeId: d.dispute_id,
            status: d.status,
            reason: d.reason,
            disputeAmount: parseFloat(d.dispute_amount?.value || "0"),
            currency: d.dispute_amount?.currency_code || "USD",
            rawPayload: JSON.stringify(d),
          },
        });

        // Transition booking to DISPUTED
        await transitionBookingStatus({
          bookingId: capture.bookingId,
          toStatus: "DISPUTED",
          actor: "PAYPAL",
          reason: `PayPal dispute filed: ${d.dispute_id} (${d.reason})`,
          payload: { disputeId: d.dispute_id },
        });

        synced.push(created);
      } else {
        const updated = await db.dispute.update({
          where: { id: existingDispute.id },
          data: {
            status: d.status,
            rawPayload: JSON.stringify(d),
          },
        });
        synced.push(updated);
      }
    }

    const allDisputes = await db.dispute.findMany({
      include: {
        booking: {
          include: {
            item: true,
            captures: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      syncedCount: synced.length,
      disputes: allDisputes,
    });
  } catch (error: any) {
    console.error("Disputes sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

