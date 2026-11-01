import { describe, it, expect } from "vitest";
import { canTransition, ALLOWED_TRANSITIONS, BookingStatus } from "../src/lib/state-machine";

describe("Booking State Machine Transitions", () => {
  it("allows all valid forward progression transitions", () => {
    // Normal happy path
    expect(canTransition("PENDING_PAYMENT", "HELD")).toBe(true);
    expect(canTransition("HELD", "CHECKED_OUT")).toBe(true);
    expect(canTransition("CHECKED_OUT", "RETURNED")).toBe(true);
    expect(canTransition("RETURNED", "INSPECTING")).toBe(true);
    expect(canTransition("INSPECTING", "PROPOSED")).toBe(true);
    expect(canTransition("PROPOSED", "SETTLED")).toBe(true);

    // Clean return shortcut (zero damage)
    expect(canTransition("INSPECTING", "SETTLED")).toBe(true);

    // Contest loop
    expect(canTransition("PROPOSED", "CONTESTED")).toBe(true);
    expect(canTransition("CONTESTED", "PROPOSED")).toBe(true);
    expect(canTransition("CONTESTED", "SETTLED")).toBe(true);

    // Cancellation
    expect(canTransition("PENDING_PAYMENT", "CANCELLED")).toBe(true);
    expect(canTransition("HELD", "CANCELLED")).toBe(true);

    // Disputes
    expect(canTransition("SETTLED", "DISPUTED")).toBe(true);
    expect(canTransition("DISPUTED", "SETTLED")).toBe(true);
  });

  it("strictly rejects illegal state transitions", () => {
    // Cannot jump from unreserved to settled
    expect(canTransition("PENDING_PAYMENT", "SETTLED")).toBe(false);

    // Cannot jump from HELD to RETURNED without CHECKED_OUT
    expect(canTransition("HELD", "RETURNED")).toBe(false);

    // Cannot checkout from CANCELLED
    expect(canTransition("CANCELLED", "CHECKED_OUT")).toBe(false);

    // Cannot transition out of CANCELLED
    expect(canTransition("CANCELLED", "HELD")).toBe(false);

    // Cannot jump directly from CHECKED_OUT to SETTLED without return inspection
    expect(canTransition("CHECKED_OUT", "SETTLED")).toBe(false);
  });
});

