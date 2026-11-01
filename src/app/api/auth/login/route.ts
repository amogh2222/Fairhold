import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const owner = await db.ownerUser.findUnique({ where: { email } });
    if (!owner) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await comparePassword(password, owner.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const business = await db.business.findUnique({ where: { id: owner.businessId } });

    const sessionToken = createSessionToken({
      ownerId: owner.id,
      email: owner.email,
      businessId: owner.businessId,
    });

    const response = NextResponse.json({
      success: true,
      owner: { id: owner.id, email: owner.email, businessId: owner.businessId },
      business,
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
