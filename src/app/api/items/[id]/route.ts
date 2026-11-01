import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentOwner } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const formatted = {
      ...item,
      shotList: typeof item.shotList === "string" ? JSON.parse(item.shotList) : item.shotList,
      rateCard: typeof item.rateCard === "string" ? JSON.parse(item.rateCard) : item.rateCard,
      replacementSources:
        typeof item.replacementSources === "string"
          ? JSON.parse(item.replacementSources)
          : item.replacementSources,
      images: typeof item.images === "string" ? JSON.parse(item.images) : item.images,
    };

    return NextResponse.json({ item: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentOwner();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.category !== undefined) data.category = body.category;
    if (body.dailyRate !== undefined) data.dailyRate = Number(body.dailyRate);
    if (body.depositAmount !== undefined) data.depositAmount = Number(body.depositAmount);
    if (body.replacementValue !== undefined) data.replacementValue = Number(body.replacementValue);
    if (body.inService !== undefined) data.inService = Boolean(body.inService);
    if (body.shotList !== undefined) {
      data.shotList = typeof body.shotList === "string" ? body.shotList : JSON.stringify(body.shotList);
    }
    if (body.rateCard !== undefined) {
      data.rateCard = typeof body.rateCard === "string" ? body.rateCard : JSON.stringify(body.rateCard);
    }
    if (body.images !== undefined) {
      data.images = typeof body.images === "string" ? body.images : JSON.stringify(body.images);
    }
    if (body.replacementSources !== undefined) {
      data.replacementSources =
        typeof body.replacementSources === "string"
          ? body.replacementSources
          : JSON.stringify(body.replacementSources);
    }

    const updated = await db.item.update({
      where: { id },
      data,
    });

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
