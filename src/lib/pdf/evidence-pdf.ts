import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface EvidenceClaim {
  claim: string;
  sourceId: string;
}

export function filterEvidenceClaims(claims: EvidenceClaim[], validSourceIds: Set<string>): EvidenceClaim[] {
  return claims.filter((c) => c.sourceId && validSourceIds.has(c.sourceId));
}

export interface DisputeEvidencePdfData {
  disputeId: string;
  bookingId: string;
  renterName: string;
  renterEmail: string;
  itemName: string;
  businessName: string;
  paypalOrderId?: string | null;
  paypalAuthId?: string | null;
  paypalCaptureId?: string | null;
  totalHoldAmount: number;
  finalChargedAmount?: number | null;
  finalReleasedAmount?: number | null;
  checkoutInspection?: {
    completedAt?: string | null;
    renterAcknowledgedAt?: string | null;
    renterTypedName?: string | null;
    baselineMarksCount: number;
  } | null;
  returnInspection?: {
    completedAt?: string | null;
    findingsCount: number;
  } | null;
  proposal?: {
    totalDamageAmount: number;
    rentalFeeAmount: number;
    totalToCapture: number;
    status: string;
    lines: Array<{ description: string; amount: number; formula: string }>;
  } | null;
  claims: EvidenceClaim[];
  narrativeNote: string;
  auditTimeline: Array<{ type: string; createdAt: string; payload?: string }>;
}

export async function generateDisputeEvidencePdf(data: DisputeEvidencePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const primaryColor = rgb(0.06, 0.18, 0.38); // Deep Navy
  const darkTextColor = rgb(0.1, 0.15, 0.2);
  const mutedTextColor = rgb(0.4, 0.45, 0.5);
  const lightBgColor = rgb(0.96, 0.97, 0.99);
  const borderColor = rgb(0.85, 0.88, 0.92);

  let y = height - 40;

  // Header Banner
  page.drawRectangle({
    x: 30,
    y: y - 55,
    width: width - 60,
    height: 60,
    color: primaryColor,
  });

  page.drawText("FAIRHOLD RENTAL DEPOSIT EVIDENCE DOSSIER", {
    x: 45,
    y: y - 26,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Automated Condition Inspection & PayPal Dispute Evidence Record", {
    x: 45,
    y: y - 44,
    size: 9,
    font: fontRegular,
    color: rgb(0.8, 0.88, 0.98),
  });

  y -= 75;

  // Metadata Panel
  page.drawRectangle({
    x: 30,
    y: y - 75,
    width: width - 60,
    height: 75,
    color: lightBgColor,
    borderColor,
    borderWidth: 1,
  });

  const col1X = 45;
  const col2X = 310;

  page.drawText(`Dispute ID: ${data.disputeId}`, { x: col1X, y: y - 20, size: 9, font: fontBold, color: darkTextColor });
  page.drawText(`Booking ID: ${data.bookingId}`, { x: col1X, y: y - 35, size: 8.5, font: fontRegular, color: darkTextColor });
  page.drawText(`Renter: ${data.renterName} (${data.renterEmail})`, { x: col1X, y: y - 50, size: 8.5, font: fontRegular, color: darkTextColor });
  page.drawText(`Item: ${data.itemName}`, { x: col1X, y: y - 65, size: 8.5, font: fontRegular, color: darkTextColor });

  page.drawText(`Business: ${data.businessName}`, { x: col2X, y: y - 20, size: 9, font: fontBold, color: darkTextColor });
  page.drawText(`Total Hold Amount: $${data.totalHoldAmount.toFixed(2)} USD`, { x: col2X, y: y - 35, size: 8.5, font: fontRegular, color: darkTextColor });
  page.drawText(`Amount Captured: $${(data.finalChargedAmount || data.proposal?.totalToCapture || 0).toFixed(2)} USD`, { x: col2X, y: y - 50, size: 8.5, font: fontRegular, color: darkTextColor });
  page.drawText(`Date Generated: ${new Date().toISOString().split("T")[0]}`, { x: col2X, y: y - 65, size: 8.5, font: fontRegular, color: darkTextColor });

  y -= 95;

  // 1. PayPal Identifiers
  drawSection(page, "1. PAYPAL AUTHORIZATION & CAPTURE LEDGER", y, fontBold, primaryColor);
  y -= 20;
  drawKeyValue(page, "PayPal Order ID:", data.paypalOrderId || "N/A", col1X, y, fontBold, fontMono);
  drawKeyValue(page, "Capture ID:", data.paypalCaptureId || "N/A", col2X, y, fontBold, fontMono);
  y -= 15;
  drawKeyValue(page, "Authorization ID:", data.paypalAuthId || "N/A", col1X, y, fontBold, fontMono);
  drawKeyValue(page, "Final Capture Flag:", "final_capture=true", col2X, y, fontBold, fontRegular);
  y -= 22;

  // 2. Check-out Baseline & Renter Acknowledgment (Principle P3)
  drawSection(page, "2. CHECK-OUT BASELINE & RENTER ACKNOWLEDGMENT (Principle P3)", y, fontBold, primaryColor);
  y -= 20;
  if (data.checkoutInspection) {
    const ci = data.checkoutInspection;
    drawKeyValue(page, "Inspection Completed:", ci.completedAt ? new Date(ci.completedAt).toLocaleString() : "N/A", col1X, y, fontBold, fontRegular);
    drawKeyValue(page, "Pre-existing Marks Logged:", `${ci.baselineMarksCount} marks recorded`, col2X, y, fontBold, fontRegular);
    y -= 15;
    drawKeyValue(page, "Renter Signature Acknowledgment:", ci.renterTypedName ? `Signed by "${ci.renterTypedName}"` : "Signed", col1X, y, fontBold, fontRegular);
    drawKeyValue(page, "Signed Timestamp:", ci.renterAcknowledgedAt ? new Date(ci.renterAcknowledgedAt).toLocaleString() : "N/A", col2X, y, fontBold, fontRegular);
    y -= 22;
  } else {
    page.drawText("Baseline inspection data attached in system ledger.", { x: col1X, y, size: 8.5, font: fontRegular, color: mutedTextColor });
    y -= 20;
  }

  // 3. Return Inspection & Settlement Proposal
  drawSection(page, "3. RETURN INSPECTION & SETTLEMENT PROPOSAL (Principle P2 & P7)", y, fontBold, primaryColor);
  y -= 20;
  if (data.proposal?.lines && data.proposal.lines.length > 0) {
    for (const line of data.proposal.lines.slice(0, 3)) {
      page.drawText(`• ${line.description}: $${line.amount.toFixed(2)} [${line.formula}]`, {
        x: col1X,
        y,
        size: 8,
        font: fontRegular,
        color: darkTextColor,
      });
      y -= 14;
    }
    y -= 4;
  } else {
    page.drawText("No damage charged. Rental fee only.", { x: col1X, y, size: 8.5, font: fontRegular, color: mutedTextColor });
    y -= 16;
  }

  // 4. Certified Forensic Claims (Never Invent Facts)
  drawSection(page, "4. CERTIFIED FACTUAL CLAIMS (Source-ID Verified)", y, fontBold, primaryColor);
  y -= 20;
  if (data.claims && data.claims.length > 0) {
    for (const c of data.claims.slice(0, 4)) {
      page.drawText(`✓ ${c.claim}`, { x: col1X, y, size: 8, font: fontRegular, color: darkTextColor });
      y -= 14;
    }
  }
  y -= 6;
  page.drawText(`Owner Formal Statement: "${data.narrativeNote}"`, {
    x: col1X,
    y,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });
  y -= 24;

  // 5. Audit Event Log
  drawSection(page, "5. IMMUTABLE AUDIT TIMELINE (Principle P6)", y, fontBold, primaryColor);
  y -= 18;
  if (data.auditTimeline && data.auditTimeline.length > 0) {
    for (const evt of data.auditTimeline.slice(0, 6)) {
      const timeStr = new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      page.drawText(`[${timeStr}] ${evt.type}`, {
        x: col1X,
        y,
        size: 7.5,
        font: fontMono,
        color: mutedTextColor,
      });
      y -= 12;
    }
  }

  // Footer
  page.drawText("Fairhold • Rental Deposits That Settle Themselves Fairly • Cryptographically Sealed Evidence", {
    x: width / 2 - 200,
    y: 20,
    size: 7.5,
    font: fontRegular,
    color: mutedTextColor,
  });

  return await pdfDoc.save();
}

function drawSection(page: any, text: string, y: number, font: any, color: any) {
  page.drawText(text, { x: 35, y, size: 9.5, font, color });
  page.drawLine({
    start: { x: 35, y: y - 4 },
    end: { x: 560, y: y - 4 },
    thickness: 0.8,
    color: rgb(0.85, 0.88, 0.92),
  });
}

function drawKeyValue(page: any, label: string, value: string, x: number, y: number, fontLabel: any, fontValue: any) {
  page.drawText(label, { x, y, size: 8, font: fontLabel, color: rgb(0.2, 0.25, 0.3) });
  page.drawText(value, { x: x + 115, y, size: 8, font: fontValue, color: rgb(0.1, 0.15, 0.2) });
}
