import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTextAI } from "@/lib/ai/provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Fetch live metrics from database
    const bookings = await db.booking.findMany({
      include: {
        item: true,
        authorizations: true,
        captures: true,
        proposal: true,
      },
    });

    const items = await db.item.findMany();

    const totalBookings = bookings.length;
    const activeHolds = bookings.filter((b: any) => ["HELD", "CHECKED_OUT", "RETURNED", "INSPECTING", "PROPOSED", "CONTESTED"].includes(b.status));
    const settledBookings = bookings.filter((b: any) => b.status === "SETTLED");
    const disputedBookings = bookings.filter((b: any) => b.status === "DISPUTED");

    let totalHeldAmount = 0;
    for (const b of activeHolds) {
      const activeAuth = b.authorizations?.find((a: any) => a.status === "ACTIVE" || a.status === "CREATED");
      if (activeAuth) totalHeldAmount += activeAuth.amount;
    }

    let totalDamageCaptured = 0;
    let totalDepositsReleased = 0;
    let cleanReturnsCount = 0;

    for (const b of settledBookings) {
      const capture = b.captures?.[0];
      if (capture) {
        totalDamageCaptured += capture.damageAmount || 0;
        if ((capture.damageAmount || 0) === 0) {
          cleanReturnsCount++;
        }
      }
      if (b.proposal) {
        totalDepositsReleased += b.proposal.proposedRefund || 0;
      }
    }

    const fairnessRatio =
      settledBookings.length > 0
        ? Math.round((cleanReturnsCount / settledBookings.length) * 100)
        : 100;

    const metricsSummary = {
      totalBookings,
      activeHoldsCount: activeHolds.length,
      settledBookingsCount: settledBookings.length,
      disputedBookingsCount: disputedBookings.length,
      totalHeldAmountDollars: totalHeldAmount,
      totalDamageCapturedDollars: totalDamageCaptured,
      totalDepositsReleasedDollars: totalDepositsReleased,
      fairnessRatioPercent: fairnessRatio,
      inventoryCount: items.length,
    };

    // 2. Query AI with full operational & payment metrics context
    const systemPrompt = `You are the Fairhold AG Studio Analytics Agent, powered by the PayPal Agent Toolkit.
You provide real-time financial, risk, and operational intelligence to gear rental owners.
Always base your conclusions on the verified operational data provided below.
Keep answers concise, actionable, and formatted in clean markdown.

Current Business Live Snapshot:
- Total Bookings to Date: ${metricsSummary.totalBookings}
- Active Deposit Holds in PayPal: \$${metricsSummary.totalHeldAmountDollars.toFixed(2)} (${metricsSummary.activeHoldsCount} active rentals)
- Total Damage Captured: \$${metricsSummary.totalDamageCapturedDollars.toFixed(2)}
- Total Deposits Released to Renters: \$${metricsSummary.totalDepositsReleasedDollars.toFixed(2)}
- Fairness Ratio (% clean returns with 100% deposit returned): ${metricsSummary.fairnessRatioPercent}%
- Current Active Disputes: ${metricsSummary.disputedBookingsCount}
- In-Service Items: ${metricsSummary.inventoryCount}`;

    const reply = await generateTextAI({
      systemPrompt,
      prompt,
      fallbackText: `Based on your Fairhold portfolio:
- **Active Deposit Holds**: You currently have **\$${metricsSummary.totalHeldAmountDollars.toFixed(2)}** secured across **${metricsSummary.activeHoldsCount}** active rentals.
- **Fairness Ratio**: **${metricsSummary.fairnessRatioPercent}%** of returns completed without damage charges, reflecting strong alignment between check-out baseline photos and return inspections.
- **Dispute Rate**: **${metricsSummary.disputedBookingsCount}** active disputes. With Fairhold's tamper-evident baseline photos and signed agreements, evidence dossiers have a 100% source-verified audit trail.`,
    });

    return NextResponse.json({
      metrics: metricsSummary,
      reply,
    });
  } catch (error: any) {
    console.error("Analytics agent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

