# Fairhold • PayPal Sandbox Configuration & Testing Guide

This guide walks through configuring real PayPal Sandbox developer credentials, webhooks, and testing the end-to-end Fairhold rental deposit lifecycle.

---

## 1. PayPal Developer Portal Setup

1. Go to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Log in with your PayPal developer credentials.
3. Under **Apps & Credentials**, select the **Sandbox** tab.
4. Click **Create App**:
   - **App Name**: `Fairhold Rental Protection`
   - **App Type**: `Merchant`
5. Copy your **Client ID** and **Secret Key**.
6. Set them in your local `.env`:
   ```bash
   PAYPAL_CLIENT_ID="your_sandbox_client_id"
   PAYPAL_CLIENT_SECRET="your_sandbox_secret_key"
   PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"
   ```

---

## 2. Sandbox Testing Accounts

PayPal automatically provisions two types of sandbox accounts under **Testing Tools > Sandbox Accounts**:

1. **Business Account** (Owner/Merchant):
   - Receives rental authorizations and captures.
2. **Personal Account** (Renter/Buyer):
   - Used to approve the authorization hold on `/b/[slug]`.
   - Default balance is typically \$5,000 USD in sandbox money.

---

## 3. Webhook Configuration

To receive asynchronous PayPal payment events in real time:

1. In your PayPal App page, scroll to **Sandbox Webhooks** and click **Add Webhook**.
2. **Webhook URL**:
   - Local testing: Use an ngrok/cloudflared tunnel: `https://your-tunnel.ngrok-free.app/api/webhooks/paypal`
   - Production (Render): `https://fairhold.onrender.com/api/webhooks/paypal`
3. Check the following **Event Types**:
   - `Payment authorization created` (`PAYMENT.AUTHORIZATION.CREATED`)
   - `Payment authorization voided` (`PAYMENT.AUTHORIZATION.VOIDED`)
   - `Payment capture completed` (`PAYMENT.CAPTURE.COMPLETED`)
   - `Customer dispute created` (`CUSTOMER.DISPUTE.CREATED`)
   - `Customer dispute resolved` (`CUSTOMER.DISPUTE.RESOLVED`)
4. Copy the generated **Webhook ID** into `.env`:
   ```bash
   PAYPAL_WEBHOOK_ID="your_webhook_id"
   ```

---

## 4. End-to-End Judge Test Scenarios

### Scenario A: Clean Return (Zero Damage, 100% Deposit Released)
1. Open Storefront at `/b/summit-shutter`.
2. Select **Sony Alpha 7 IV**, pick dates, and click **Authorize Hold with PayPal**.
3. Log in with your Sandbox Personal account and approve the \$725.00 hold ($225 rental fee + $500 deposit).
4. As Owner, go to `/owner` and click **Checkout QA** on the booking.
5. Capture or click **"Act 1: Pristine Clean"** demo photo.
6. As Renter, open `/r/[token]`, review the baseline condition report, and type your name to sign.
7. Return gear: go to `/owner`, click **Return Ghost QA**, and load **"Act 1: Pristine Clean"**.
8. AI detects no damage. Review the proposal: \$225 rental fee captured, **\$500 deposit released**.
9. Click **Accept & Release**. PayPal captures the fee with `final_capture=true`, instantly releasing the \$500 hold!

### Scenario B: Proven New Damage (Gouge Scratch Capped at Deposit)
1. Book an item on `/b/summit-shutter`.
2. Sign checkout baseline report.
3. At return inspection (`/owner/inspect/[id]/return`), click **"Act 2: Gouge Damage ($175)"**.
4. AI Return Comparison detects new physical gouge into lens mount bayonet.
5. Deterministic pricing matches Rate Card: `"Chassis dent into frame / bent mount = $175.00"`.
6. Proposal: Capture rental fee + \$175 damage; release remaining deposit hold.
7. Renter accepts or contest window elapses: PayPal executes single capture with `final_capture=true`.

### Scenario C: PayPal Sandbox Dispute Resolution
1. Following Scenario B, log in to the PayPal Sandbox buyer account at `https://www.sandbox.paypal.com`.
2. Locate the capture transaction and click **Report a Problem / Dispute**.
3. Open `/owner/sandbox` in Fairhold and click **Sync Sandbox Disputes**.
4. Fairhold correlates the dispute to the rental case file via `seller_transaction_id`.
5. Click **Submit PDF Dossier**: Fairhold compiles timestamped photos, the signed checkout agreement, and deterministic math into an evidence PDF and uploads it to PayPal's Disputes API.
6. Click **Win (Seller)** to test PayPal's Sandbox Adjudication API in seller favor!
