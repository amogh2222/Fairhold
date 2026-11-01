import crypto from "crypto";
import { calculateAuthorizationTiming } from "../timing";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

export function getPayPalBaseUrl(): string {
  return process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
}

/**
 * Retrieve cached or fresh OAuth2 Bearer token from PayPal Sandbox.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60 * 1000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment.");
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to obtain PayPal access token (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Create a PayPal Order with intent = "AUTHORIZE".
 * Amount = rental fee + deposit hold, with itemized breakdown.
 */
export async function createRentalAuthorizeOrder(params: {
  bookingId: string;
  itemName: string;
  rentalFee: number;
  depositAmount: number;
  currency?: string;
  requestId?: string;
}) {
  const { bookingId, itemName, rentalFee, depositAmount, currency = "USD" } = params;
  const totalAmount = Math.round((rentalFee + depositAmount) * 100) / 100;
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const requestId = params.requestId || crypto.randomUUID();

  const payload = {
    intent: "AUTHORIZE",
    purchase_units: [
      {
        reference_id: "default",
        custom_id: bookingId,
        description: `Fairhold Rental: ${itemName}`,
        amount: {
          currency_code: currency,
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: totalAmount.toFixed(2),
            },
          },
        },
        items: [
          {
            name: `${itemName} - Rental Fee`,
            unit_amount: { currency_code: currency, value: rentalFee.toFixed(2) },
            quantity: "1",
            category: "PHYSICAL_GOODS",
          },
          {
            name: `${itemName} - Security Deposit (Held)`,
            unit_amount: { currency_code: currency, value: depositAmount.toFixed(2) },
            quantity: "1",
            category: "PHYSICAL_GOODS",
          },
        ],
      },
    ],
    application_context: {
      brand_name: "Fairhold Rental Protection",
      shipping_preference: "NO_SHIPPING",
      user_action: "CONTINUE",
    },
  };

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create PayPal order (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Authorize an approved PayPal Order.
 * Extracts authorization ID and computes timing (honor period + expiry).
 */
export async function authorizeOrder(orderId: string, requestId?: string) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const reqId = requestId || crypto.randomUUID();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/authorize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": reqId,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to authorize PayPal order ${orderId} (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const auth = data.purchase_units?.[0]?.payments?.authorizations?.[0];

  if (!auth?.id) {
    throw new Error("No authorization object found in PayPal authorize response");
  }

  const timing = calculateAuthorizationTiming(new Date(auth.create_time || Date.now()));

  return {
    authorizationId: auth.id,
    status: auth.status,
    amount: parseFloat(auth.amount?.value || "0"),
    currency: auth.amount?.currency_code || "USD",
    ...timing,
    raw: data,
  };
}

/**
 * Capture an authorization hold with final_capture=true to release remainder.
 */
export async function captureAuthorization(params: {
  authorizationId: string;
  amount: number;
  currency?: string;
  finalCapture?: boolean;
  requestId?: string;
}) {
  const { authorizationId, amount, currency = "USD", finalCapture = true } = params;
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const reqId = params.requestId || crypto.randomUUID();

  const payload = {
    amount: {
      currency_code: currency,
      value: amount.toFixed(2),
    },
    final_capture: finalCapture,
  };

  const res = await fetch(`${baseUrl}/v2/payments/authorizations/${authorizationId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": reqId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to capture PayPal authorization ${authorizationId} (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    captureId: data.id,
    status: data.status,
    amount: parseFloat(data.amount?.value || "0"),
    raw: data,
  };
}

/**
 * Void an authorization hold (release full funds).
 */
export async function voidAuthorization(authorizationId: string, requestId?: string): Promise<boolean> {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const reqId = requestId || crypto.randomUUID();

  const res = await fetch(`${baseUrl}/v2/payments/authorizations/${authorizationId}/void`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": reqId,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Failed to void authorization ${authorizationId} (${res.status}): ${errorText}`);
  }

  return true;
}

/**
 * Reauthorize an authorization whose honor period has expired.
 * Returns a NEW authorization ID.
 */
export async function reauthorizePayment(authorizationId: string, amount: number, currency: string = "USD") {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const reqId = crypto.randomUUID();

  const res = await fetch(`${baseUrl}/v2/payments/authorizations/${authorizationId}/reauthorize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": reqId,
    },
    body: JSON.stringify({
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to reauthorize payment ${authorizationId} (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const timing = calculateAuthorizationTiming(new Date());

  return {
    authorizationId: data.id,
    newAuthorizationId: data.id,
    amount: parseFloat(data.amount?.value || amount.toString()),
    currency: data.amount?.currency_code || currency,
    status: data.status,
    ...timing,
    raw: data,
  };
}

/**
 * Refund a captured payment (for post-settlement corrections).
 */
export async function refundCapture(captureId: string, amount?: number, reason?: string) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const reqId = crypto.randomUUID();

  const payload: any = {};
  if (amount) {
    payload.amount = { currency_code: "USD", value: amount.toFixed(2) };
  }
  if (reason) {
    payload.note_to_payer = reason;
  }

  const res = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": reqId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to refund capture ${captureId} (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    refundId: data.id,
    status: data.status,
    raw: data,
  };
}

/**
 * List Disputes from PayPal Disputes v1.
 */
export async function listDisputes() {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/customer/disputes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list PayPal disputes (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Get Dispute details.
 */
export async function getDispute(disputeId: string) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/customer/disputes/${disputeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get PayPal dispute ${disputeId} (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Provide Evidence to PayPal Dispute with attached evidence PDF.
 */
export async function provideDisputeEvidence(
  disputeId: string,
  evidenceInput: Record<string, any>,
  pdfBytes?: Uint8Array
) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const formData = new FormData();
  formData.append("input", JSON.stringify(evidenceInput));

  if (pdfBytes) {
    const blob = new Blob([Buffer.from(pdfBytes)], { type: "application/pdf" });
    formData.append("file", blob, "Fairhold_Dispute_Dossier.pdf");
  }

  const res = await fetch(`${baseUrl}/v1/customer/disputes/${disputeId}/provide-evidence`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to provide evidence for dispute ${disputeId} (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Accept dispute claim (refund renter).
 */
export async function acceptDisputeClaim(disputeId: string, note: string = "Claim accepted by rental owner.") {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/customer/disputes/${disputeId}/accept-claim`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to accept claim for dispute ${disputeId} (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Sandbox-only: Adjudicate dispute in buyer or seller favor.
 */
export async function sandboxAdjudicateDispute(
  disputeId: string,
  outcome: "RESOLVED_SELLER_FAVOUR" | "RESOLVED_BUYER_FAVOUR"
) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/customer/disputes/${disputeId}/adjudicate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adjudication_outcome: outcome }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to adjudicate dispute ${disputeId} in sandbox (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Sandbox-only: Require evidence.
 */
export async function sandboxRequireEvidence(
  disputeId: string,
  action: "SELLER_EVIDENCE" | "BUYER_EVIDENCE" = "SELLER_EVIDENCE"
) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/customer/disputes/${disputeId}/require-evidence`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to require evidence for dispute ${disputeId} in sandbox (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Verify PayPal Webhook Signature.
 */
export async function verifyWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  webhookEvent: any;
}): Promise<boolean> {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const res = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: params.authAlgo,
      cert_url: params.certUrl,
      transmission_id: params.transmissionId,
      transmission_sig: params.transmissionSig,
      transmission_time: params.transmissionTime,
      webhook_id: params.webhookId,
      webhook_event: params.webhookEvent,
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
