import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBaselineReport } from "@/lib/ai/baseline";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, photos } = body;

    if (!bookingId || !photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: "bookingId and photos array are required" }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { item: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create checkout inspection record
    const inspection = await db.inspection.create({
      data: {
        bookingId: booking.id,
        type: "CHECKOUT",
        status: "COMPLETED",
        summary: "Checkout baseline condition captured. Waiting for renter acknowledgment.",
      },
    });

    const createdPhotos = [];
    const detectedMarks = [];

    // Process each photo
    for (const p of photos) {
      const photo = await db.photo.create({
        data: {
          inspectionId: inspection.id,
          shotKey: p.shotKey,
          fileUrl: p.fileUrl,
          sha256Hash: p.sha256Hash || "hash_" + Math.random().toString(36).substring(2, 10),
          width: p.width || 1200,
          height: p.height || 800,
          qaStatus: "PASSED",
        },
      });
      createdPhotos.push(photo);

      // AI analyzes baseline marks
      const marks = await generateBaselineReport({
        shotKey: p.shotKey,
        photoUrl: p.fileUrl,
        itemName: booking.item.name,
      });

      for (const m of marks) {
        const mark = await db.baselineMark.create({
          data: {
            photoId: photo.id,
            shotKey: m.shotKey,
            boxYmin: m.box[0],
            boxXmin: m.box[1],
            boxYmax: m.box[2],
            boxXmax: m.box[3],
            description: m.description,
            severity: m.severity,
          },
        });
        detectedMarks.push(mark);
      }
    }

    // Audit log
    await db.auditEvent.create({
      data: {
        bookingId: booking.id,
        eventType: "CHECKOUT_INSPECTION_RECORDED",
        actor: "OWNER",
        details: JSON.stringify({
          inspectionId: inspection.id,
          photoCount: createdPhotos.length,
          preExistingMarksCount: detectedMarks.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      inspection,
      photos: createdPhotos,
      marks: detectedMarks,
    });
  } catch (error: any) {
    console.error("Checkout inspection error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
