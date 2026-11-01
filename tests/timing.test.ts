import { describe, it, expect } from "vitest";
import {
  calculateAuthorizationTiming,
  requiresReauthorizationBeforeCapture,
  validateRentalDuration,
  TestClock,
  MAX_RENTAL_DAYS,
  HONOR_PERIOD_MS,
  AUTH_EXPIRATION_MS,
} from "../src/lib/timing";

describe("Timing Rules & Clock Engine", () => {
  it("calculates 3-day honor period and 29-day auth expiry correctly", () => {
    const baseTime = new Date("2026-11-01T12:00:00Z");
    const timing = calculateAuthorizationTiming(baseTime);

    expect(timing.honorEndsAt.getTime() - baseTime.getTime()).toBe(HONOR_PERIOD_MS);
    expect(timing.expiresAt.getTime() - baseTime.getTime()).toBe(AUTH_EXPIRATION_MS);

    // Scheduled reauth should be 6 hours before honor period expires
    expect(timing.honorEndsAt.getTime() - timing.scheduledReauthAt.getTime()).toBe(6 * 60 * 60 * 1000);
  });

  it("identifies when just-in-time reauthorization is required before capture", () => {
    const baseTime = new Date("2026-11-01T12:00:00Z");
    const timing = calculateAuthorizationTiming(baseTime);
    const clock = new TestClock(baseTime);

    // Fresh authorization does not need reauthorization
    expect(requiresReauthorizationBeforeCapture(timing.honorEndsAt, clock)).toBe(false);

    // Advance clock by 2 days (48 hours) -> still inside 72h honor period
    clock.advanceDays(2);
    expect(requiresReauthorizationBeforeCapture(timing.honorEndsAt, clock)).toBe(false);

    // Advance clock to within 20 minutes of honor period expiration
    clock.advance(23 * 60 * 60 * 1000 + 45 * 60 * 1000); // 71h 45m from start
    expect(requiresReauthorizationBeforeCapture(timing.honorEndsAt, clock)).toBe(true);

    // Past 72 hours -> definitely requires reauthorization
    clock.advanceDays(1);
    expect(requiresReauthorizationBeforeCapture(timing.honorEndsAt, clock)).toBe(true);
  });

  it("validates rental duration up to 25 days and rejects longer rentals", () => {
    const start = new Date("2026-11-01");

    // 5-day rental is valid
    const endValid = new Date("2026-11-06");
    const resValid = validateRentalDuration(start, endValid);
    expect(resValid.valid).toBe(true);
    expect(resValid.days).toBe(5);

    // 25-day rental is valid (exact max limit)
    const endMax = new Date(start.getTime() + 25 * 24 * 60 * 60 * 1000);
    const resMax = validateRentalDuration(start, endMax);
    expect(resMax.valid).toBe(true);
    expect(resMax.days).toBe(25);

    // 26-day rental violates 25-day limit
    const endOver = new Date(start.getTime() + 26 * 24 * 60 * 60 * 1000);
    const resOver = validateRentalDuration(start, endOver);
    expect(resOver.valid).toBe(false);
    expect(resOver.error).toContain(`${MAX_RENTAL_DAYS} days`);

    // Inverted dates rejected
    const resInverted = validateRentalDuration(endValid, start);
    expect(resInverted.valid).toBe(false);
  });
});

