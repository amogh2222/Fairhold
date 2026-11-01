import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRentalDuration } from "@/lib/timing";
import { generateRenterToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const itemId = searchParams.get("itemId");
    const status = searchParams.get("status");
    const renterToken = searchParams.get("renterToken");

    if (renterToken) {
      const booking = await db.booking.findUnique({
        where: { renterToken },
        include: {
          item: true,
          business: true,
          inspections: true,
          authorizations: true,
          proposal: true,
          captures: true,
          auditEvents: true,
        },
      });
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      return NextResponse.json({ booking });
    }

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (itemId) where.itemId = itemId;
    if (status) where.status = status;

    const bookings = await db.booking.findMany({
      where,
      include: {
        item: true,
        proposal: true,
        authorizations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, startDate, endDate, renterName, renterEmail } = body;

    if (!itemId || !startDate || !endDate || !renterName || !renterEmail) {
      return NextResponse.json(
        { error: "itemId, startDate, endDate, renterName, and renterEmail are required" },
        { status: 400 }
      );
    }

    const item = await db.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const duration = validateRentalDuration(start, end);
    if (!duration.valid) {
      return NextResponse.json({ error: duration.error }, { status: 400 });
    }

    // Check availability
    const existingBookings = await db.booking.findMany({
      where: { itemId },
    });

    const isOverlap = existingBookings.some((b: any) => {
      if (b.status === "CANCELLED" || b.status === "SETTLED") return false;
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return start < bEnd && end > bStart;
    });

    if (isOverlap) {
      return NextResponse.json(
        { error: "Selected dates are no longer available for this item." },
        { status: 409 }
      );
    }

    const rentalFee = Math.round(item.dailyRate * duration.days * 100) / 100;
    const depositAmount = item.depositAmount;
    const totalAuthorized = Math.round((rentalFee + depositAmount) * 100) / 100;
    const renterToken = generateRenterToken();

    const booking = await db.booking.create({
      data: {
        businessId: item.businessId,
        itemId: item.id,
        renterName,
        renterEmail,
        renterToken,
        startDate: start,
        endDate: end,
        rentalFee,
        depositAmount,
        totalAuthorized,
        currency: "USD",
        status: "PENDING_PAYMENT",
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        bookingId: booking.id,
        eventType: "BOOKING_CREATED",
        actor: "renter",
        details: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          days: duration.days,
          rentalFee,
          depositAmount,
        }),
      },
    });

    return NextResponse.json({
      booking: {
        ...booking,
        item,
      },
      pricing: {
        dailyRate: item.dailyRate,
        days: duration.days,
        rentalFee,
        depositAmount,
        totalAuthorized,
      },
    });
  } catch (error: any) {
    console.error("POST booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
