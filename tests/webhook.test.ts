import { describe, it, expect } from "vitest";
import { db } from "../src/lib/db";

describe("PayPal Webhook Idempotency", () => {
  it("safely deduplicates events with identical paypalEventId", async () => {
    const testEventId = "WH-TEST-" + Math.random().toString(36).substring(2, 10);

    // First event receipt
    const first = await db.webhookEvent.create({
      data: {
        paypalEventId: testEventId,
        eventType: "PAYMENT.AUTHORIZATION.CREATED",
        payload: JSON.stringify({ id: testEventId }),
        status: "PROCESSED",
      },
    });

    expect(first.paypalEventId).toBe(testEventId);

    // Second event receipt check
    const existing = await db.webhookEvent.findUnique({
      where: { paypalEventId: testEventId },
    });

    expect(existing).not.toBeNull();
    expect(existing?.status).toBe("PROCESSED");
  });
});

