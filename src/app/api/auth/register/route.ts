import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, businessName, slug, wearAndTearPolicy, contestWindowHours, aiConfidenceThreshold } = body;

    if (!email || !password || !businessName || !slug) {
      return NextResponse.json(
        { error: "Email, password, business name, and slug are required" },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existingOwner = await db.ownerUser.findUnique({ where: { email } });
    if (existingOwner) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Check slug uniqueness
    const existingBiz = await db.business.findUnique({ where: { slug } });
    if (existingBiz) {
      return NextResponse.json({ error: "Business slug is already taken" }, { status: 409 });
    }

    // Create business
    const business = await db.business.create({
      data: {
        name: businessName,
        slug,
        currency: "USD",
        wearAndTearPolicy:
          wearAndTearPolicy ||
          "Superficial scratches under 10mm on non-optical/non-screen surfaces, minor cosmetic rub marks, dust, and expected light wear on grips are considered normal wear and tear and are not chargeable.",
        contestWindowHours: contestWindowHours ? Number(contestWindowHours) : 24,
        aiConfidenceThreshold: aiConfidenceThreshold ? Number(aiConfidenceThreshold) : 0.75,
      },
    });

    // Hash password and create owner user
    const passwordHash = await hashPassword(password);
    const owner = await db.ownerUser.create({
      data: {
        email,
        passwordHash,
        businessId: business.id,
      },
    });

    const sessionToken = createSessionToken({
      ownerId: owner.id,
      email: owner.email,
      businessId: business.id,
    });

    const response = NextResponse.json({
      success: true,
      owner: { id: owner.id, email: owner.email, businessId: business.id },
      business,
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}

