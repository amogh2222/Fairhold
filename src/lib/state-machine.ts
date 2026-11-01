import { db } from "./db";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "HELD"
  | "CHECKED_OUT"
  | "RETURNED"
  | "INSPECTING"
  | "PROPOSED"
  | "CONTESTED"
  | "SETTLED"
  | "CANCELLED"
  | "DISPUTED"
  | "FLAGGED";

export type ActorType = "SYSTEM" | "OWNER" | "RENTER" | "PAYPAL";

export class InvalidStateTransitionError extends Error {
  constructor(public fromStatus: string, public toStatus: string, message?: string) {
    super(message || `Invalid booking state transition from '${fromStatus}' to '${toStatus}'`);
    this.name = "InvalidStateTransitionError";
  }
}

// State Machine transition rules
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_PAYMENT: ["HELD", "CANCELLED"],
  HELD: ["CHECKED_OUT", "CANCELLED", "FLAGGED"],
  CHECKED_OUT: ["RETURNED", "FLAGGED", "DISPUTED"],
  RETURNED: ["INSPECTING", "DISPUTED"],
  INSPECTING: ["PROPOSED", "SETTLED", "DISPUTED"], // SETTLED directly if clean return with 0 damage & 0 pending fee
  PROPOSED: ["CONTESTED", "SETTLED", "DISPUTED"],
  CONTESTED: ["PROPOSED", "SETTLED", "DISPUTED"],
  SETTLED: ["DISPUTED"],
  CANCELLED: [],
  DISPUTED: ["SETTLED"], // can return to settled after dispute resolved
  FLAGGED: ["HELD", "CHECKED_OUT", "SETTLED", "CANCELLED"],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export async function transitionBookingStatus(params: {
  bookingId: string;
  toStatus: BookingStatus;
  actor: ActorType;
  reason?: string;
  payload?: Record<string, any>;
}) {
  const { bookingId, toStatus, actor, reason, payload = {} } = params;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const currentStatus = booking.status as BookingStatus;

  // Validate transition
  if (!canTransition(currentStatus, toStatus)) {
    throw new InvalidStateTransitionError(currentStatus, toStatus);
  }

  // Update booking
  const updated = await db.booking.update({
    where: { id: bookingId },
    data: { status: toStatus },
  });

  // Record Audit Event (Principle P6)
  await db.auditEvent.create({
    data: {
      bookingId,
      actor,
      type: `STATUS_CHANGED_${toStatus}`,
      payload: JSON.stringify({
        fromStatus: currentStatus,
        toStatus,
        reason: reason || "Standard state machine transition",
        ...payload,
      }),
    },
  });

  return updated;
}

