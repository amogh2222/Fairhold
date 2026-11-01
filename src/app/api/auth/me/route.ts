import { NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/auth";

export async function GET() {
  try {
    const current = await getCurrentOwner();
    if (!current) {
      return NextResponse.json({ authenticated: false, owner: null, business: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      owner: {
        id: current.owner.id,
        email: current.owner.email,
        businessId: current.owner.businessId,
      },
      business: current.business,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

