import { NextResponse } from "next/server";

interface WaitlistEntry {
  email: string;
  consent: boolean;
  createdAt: string;
}

const waitlistStore: Map<string, WaitlistEntry> = new Map();

export async function POST(req: Request) {
  try {
    const { email, consent } = await req.json();

    if (!email || !consent) {
      return NextResponse.json(
        { error: "Email and explicit consent are required." },
        { status: 400 }
      );
    }

    waitlistStore.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      consent: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "You've been added to the Fairhold pilot waitlist.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const deleted = waitlistStore.delete(email.toLowerCase());
    return NextResponse.json({
      success: true,
      deleted,
      message: deleted
        ? "Your email and consent record have been completely deleted."
        : "Email not found on waitlist.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

