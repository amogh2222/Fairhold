import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proposal = await db.settlementProposal.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            item: true,
            business: true,
            authorizations: true,
            captures: true,
          },
        },
        contestItems: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Fetch findings for the inspection
    const findings = await db.finding.findMany({
      where: { inspectionId: proposal.inspectionId },
    });

    return NextResponse.json({
      proposal: {
        ...proposal,
        breakdown: typeof proposal.breakdownJson === "string" ? JSON.parse(proposal.breakdownJson) : proposal.breakdownJson,
        findings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
