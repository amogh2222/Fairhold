export interface Clock {
  now(): Date;
}

export const SystemClock: Clock = {
  now: () => new Date(),
};

export class TestClock implements Clock {
  constructor(private currentTime: Date) {}
  now(): Date {
    return new Date(this.currentTime.getTime());
  }
  advance(ms: number) {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }
  advanceDays(days: number) {
    this.advance(days * 24 * 60 * 60 * 1000);
  }
}

export const MAX_RENTAL_DAYS = 25;
export const HONOR_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days (72 hours)
export const AUTH_EXPIRATION_MS = 29 * 24 * 60 * 60 * 1000; // 29 days

export interface AuthorizationTiming {
  createdAt: Date;
  honorEndsAt: Date;
  expiresAt: Date;
  scheduledReauthAt: Date;
}

export function calculateAuthorizationTiming(createdAt: Date = new Date()): AuthorizationTiming {
  const honorEndsAt = new Date(createdAt.getTime() + HONOR_PERIOD_MS);
  const expiresAt = new Date(createdAt.getTime() + AUTH_EXPIRATION_MS);
  // Schedule reauthorization 6 hours before honor period ends
  const scheduledReauthAt = new Date(honorEndsAt.getTime() - 6 * 60 * 60 * 1000);

  return {
    createdAt,
    honorEndsAt,
    expiresAt,
    scheduledReauthAt,
  };
}

/**
 * Just-in-time check before capture:
 * If the current honor period has expired (or within 1 hour of expiration),
 * a reauthorization must be executed first before capturing.
 */
export function requiresReauthorizationBeforeCapture(
  honorEndsAt: Date,
  clock: Clock = SystemClock
): boolean {
  const now = clock.now().getTime();
  // Buffer of 30 minutes
  return now >= honorEndsAt.getTime() - 30 * 60 * 1000;
}

/**
 * Validate rental duration does not exceed PayPal authorization lifespan constraint (25 days).
 */
export function validateRentalDuration(startDate: Date, endDate: Date): {
  valid: boolean;
  days: number;
  error?: string;
} {
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (days <= 0) {
    return { valid: false, days, error: "End date must be after start date." };
  }

  if (days > MAX_RENTAL_DAYS) {
    return {
      valid: false,
      days,
      error: `Maximum rental duration is ${MAX_RENTAL_DAYS} days to guarantee PayPal authorization hold coverage.`,
    };
  }

  return { valid: true, days };
}
