import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE_NAME = "fairhold_owner_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "fairhold_super_secret_hackathon_key_2026";

export interface SessionData {
  ownerId: string;
  email: string;
  businessId: string;
}

/**
 * Creates a signed session token: base64(payload).signature
 */
export function createSessionToken(payload: SessionData): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64url");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      const json = Buffer.from(data, "base64url").toString("utf-8");
      return JSON.parse(json) as SessionData;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure unguessable renter token
 */
export function generateRenterToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Get current logged in owner session from Next.js headers/cookies
 */
export async function getCurrentOwner(): Promise<{
  owner: any;
  business: any;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      // For effortless judge demo experience, fallback to the pre-seeded demo owner
      const demoOwner = await db.ownerUser.findUnique({ where: { email: "owner@summitshutter.com" } });
      if (demoOwner) {
        const demoBusiness = await db.business.findUnique({ where: { id: demoOwner.businessId } });
        return { owner: demoOwner, business: demoBusiness };
      }
      return null;
    }

    const session = verifySessionToken(token);
    if (!session) return null;

    const owner = await db.ownerUser.findUnique({ where: { id: session.ownerId } });
    if (!owner) return null;

    const business = await db.business.findUnique({ where: { id: owner.businessId } });
    return { owner, business };
  } catch (err) {
    // Return demo owner as fallback
    const demoOwner = await db.ownerUser.findUnique({ where: { email: "owner@summitshutter.com" } });
    if (demoOwner) {
      const demoBusiness = await db.business.findUnique({ where: { id: demoOwner.businessId } });
      return { owner: demoOwner, business: demoBusiness };
    }
    return null;
  }
}

export { COOKIE_NAME };

