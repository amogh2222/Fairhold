import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRentalAuthorizeOrder } from "@/lib/paypal/client";
import { validateRentalDuration } from "@/lib/timing";
import { generateRenterToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let bookingId = body.bookingId;
    let booking: any = null;

    if (bookingId) {
      booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: { item: true },
      });
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
    } else {
      // Create booking directly if details passed
      const { itemId, startDate, endDate, renterName, renterEmail } = body;
      if (!itemId || !startDate || !endDate || !renterName || !renterEmail) {
        return NextResponse.json(
          { error: "Missing required booking fields (itemId, dates, renter details)" },
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

      const rentalFee = Math.round(item.dailyRate * duration.days * 100) / 100;
      const depositAmount = item.depositAmount;
      const totalAuthorized = Math.round((rentalFee + depositAmount) * 100) / 100;
      const renterToken = generateRenterToken();

      booking = await db.booking.create({
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
      booking.item = item;
      bookingId = booking.id;
    }

    // Call PayPal Orders v2 with intent="AUTHORIZE"
    const orderData = await createRentalAuthorizeOrder({
      bookingId: booking.id,
      itemName: booking.item.name,
      rentalFee: booking.rentalFee,
      depositAmount: booking.depositAmount,
      currency: booking.currency || "USD",
    });

    return NextResponse.json({
      orderId: orderData.id,
      bookingId: booking.id,
      renterToken: booking.renterToken,
    });
  } catch (error: any) {
    console.error("PayPal create-order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

