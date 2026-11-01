import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentOwner } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessSlug = searchParams.get("businessSlug");
    const businessIdParam = searchParams.get("businessId");

    let businessId = businessIdParam;
    if (businessSlug) {
      const biz = await db.business.findUnique({ where: { slug: businessSlug } });
      if (biz) businessId = biz.id;
    }

    if (!businessId) {
      const current = await getCurrentOwner();
      if (current) {
        businessId = current.business.id;
      }
    }

    const items = await db.item.findMany({
      where: businessId ? { businessId, inService: true } : { inService: true },
    });

    // Parse JSON fields if strings
    const formatted = items.map((i: any) => ({
      ...i,
      shotList: typeof i.shotList === "string" ? JSON.parse(i.shotList) : i.shotList,
      rateCard: typeof i.rateCard === "string" ? JSON.parse(i.rateCard) : i.rateCard,
      replacementSources:
        typeof i.replacementSources === "string" ? JSON.parse(i.replacementSources) : i.replacementSources,
      images: typeof i.images === "string" ? JSON.parse(i.images) : i.images,
    }));

    return NextResponse.json({ items: formatted });
  } catch (error: any) {
    console.error("GET items error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const current = await getCurrentOwner();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      category,
      dailyRate,
      depositAmount,
      replacementValue,
      shotList,
      rateCard,
      images,
      inService = true,
    } = body;

    if (!name || !category || !dailyRate || !depositAmount || !replacementValue) {
      return NextResponse.json(
        { error: "name, category, dailyRate, depositAmount, and replacementValue are required" },
        { status: 400 }
      );
    }

    const item = await db.item.create({
      data: {
        businessId: current.business.id,
        name,
        category,
        dailyRate: Number(dailyRate),
        depositAmount: Number(depositAmount),
        replacementValue: Number(replacementValue),
        shotList: typeof shotList === "string" ? shotList : JSON.stringify(shotList || []),
        rateCard: typeof rateCard === "string" ? rateCard : JSON.stringify(rateCard || []),
        replacementSources: JSON.stringify([]),
        images: typeof images === "string" ? images : JSON.stringify(images || []),
        inService: Boolean(inService),
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("POST item error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

