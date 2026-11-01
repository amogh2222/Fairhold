# Fairhold • Demo Video Recording Script (< 3 Minutes)

This script gives you an exact, second-by-second walkthrough to record your 2-minute 45-second video. Open `http://localhost:3000` (or your live Render URL) before starting.

---

### [0:00 – 0:25] The Problem & The Solution

**Visual**: Start on the Landing Page (`http://localhost:3000`). Scroll smoothly past the hero section and the 4-step diagram.

**Voiceover**:
> *"Hi everyone, this is Fairhold: rental deposits that settle themselves fairly with PayPal and AI.*
>
> *When people rent cameras, drones, or outdoor gear, the deposit becomes a fight at return. Renters get blamed for marks that were already there, while owners lack proof of when damage happened. Both sides lose trust, and merchants absorb chargebacks.*
>
> *Fairhold solves this with a deterministic four-step flow: PayPal holds the deposit, AI compares item condition at pick-up and return, the renter is charged only for proven new damage, and the rest is released in seconds."*

---

### [0:25 – 1:05] Act 1: Storefront Reservation & Baseline Signature

**Visual**: 
1. Click **"Explore Demo Storefront"** to navigate to `/b/summit-shutter`.
2. Click the **Sony Alpha 7 IV**.
3. Select dates (e.g. today to 3 days later). Point cursor at the price breakdown: **$225 Rental Fee + $500 Deposit Hold = $725 Total PayPal Authorization**.
4. Click **"Authorize $725.00 Hold with PayPal"** (or click the PayPal button).
5. Switch to `/owner` (Operations Dashboard) to show Booking #123 in status `HELD`.
6. Click **"Checkout QA"** (`/owner/inspect/[id]/checkout`). Show the camera checklist. Click **"Act 1: Pristine Clean"** (or take a photo). AI runs photo QA and confirms focus. Click **"Complete Baseline"**.
7. Now open the Renter Portal at `/r/[token]`. Show the baseline condition report with the pre-existing blemish bounding box. Check the agreement checkbox, type "Amogh Judge", and click **"Acknowledge & Sign Check-Out Baseline"**. The status updates to `CHECKED_OUT`.

**Voiceover**:
> *"In Act 1, a renter visits Summit & Shutter's storefront. With one click, the PayPal v6 Web SDK authorizes a single hold for the rental fee plus the $500 deposit. Crucially, no money moves from their account—funds are held, not captured.*
>
> *At pick-up, the owner uses our guided camera to capture baseline photos with real-time AI focus checking. The renter reviews the baseline on their private link, confirms pre-existing marks, and signs digitally before taking the gear."*

---

### [1:05 – 1:45] Act 2: Return Ghost QA & Instant Settlement

**Visual**:
1. Return to the Owner Portal (`/owner`). Point out the booking is now ready for return inspection.
2. Click **"Return Ghost QA"** (`/owner/inspect/[id]/return`).
3. Point out the **semi-transparent Ghost Overlay** of the baseline photo directly over the viewfinder, aligning the lens mount.
4. Click **"Act 2: Gouge Damage ($175)"** from the judge fast-track.
5. Click **"Complete Comparison & Settlement"**.
6. Redirects to `/owner/bookings/[id]`. Show the side-by-side comparison and the AI finding: `NEW_DAMAGE: Diagonal gouge scratch across bayonet mount`.
7. Point out the deterministic pricing table: matches Rate Card for chassis dent/bent mount = **$175.00**.
8. Switch to the Renter Portal (`/r/[token]`). Show the proposal: **$225 fee + $175 damage captured ($400 total), $325 remaining deposit released**.
9. Click **"Accept Proposal & Release Remainder"**. Show the status transition to `SETTLED`.

**Voiceover**:
> *"When the gear returns, our camera renders a ghost overlay of the baseline photo so the owner lines up the exact same angle. Our vision model compares the pair blind to the owner's desired charge, strictly separating new damage from normal wear and tear.*
>
> *Here, AI detected a new bayonet scratch. Our deterministic pricing engine matched the owner's written rate card at $175. When the renter accepts, PayPal captures the fee and damage in a single call with `final_capture=true`, which automatically releases the remaining $325 deposit back to the renter instantly!"*

---

### [1:45 – 2:20] Act 3: Sponsor Integrations (Bryntum & AG Studio)

**Visual**:
1. Click **"Bryntum Schedule"** in the top navigation bar (`/owner/schedule`).
2. Show the Bryntum Scheduler: gear items as rows, bookings colored by status. Hover over the booking bar to reveal the **PayPal 72-hour honor period timer** and **29-day authorization expiration marker**. Demonstrate that dragging beyond 25 days is blocked by our guard.
3. Click **"AG Studio"** in the navbar (`/owner/analytics`).
4. Point out the custom KPI widgets: **Active PayPal Holds ($3,600)**, **Deposits Released**, and the **Fairness Ratio Widget (88% clean return rate)**.
5. Point out the interactive AG Grid Community table.
6. Scroll to the **AG Studio Analytics Agent**. Click the sample prompt: *"Summarize our active PayPal holds and dispute risk"*. Click **Ask Studio**. Show the markdown insight stream powered by the PayPal Agent Toolkit.

**Voiceover**:
> *"Now let's examine our sponsor integrations. For Bryntum, we built a dedicated rental scheduler tracking equipment allocation alongside PayPal's 72-hour honor periods and 29-day authorization limits, with hard guards enforcing our 25-day rental cap.*
>
> *For AG Grid, our AG Studio dashboard features live KPI metrics—including our Fairness Ratio tracking 100% deposit return rates—an interactive AG Grid Community ledger, and an AI intelligence agent powered by the PayPal Agent Toolkit that analyzes rental risk in natural language."*

---

### [2:20 – 2:45] Act 4: Tamper-Evident PayPal Dispute Dossiers & Wrap-Up

**Visual**:
1. Click **"Sandbox Tools"** (`/owner/sandbox`).
2. Point out the active PayPal dispute correlated via `seller_transaction_id == captureId`.
3. Click **"Submit PDF Dossier"**. Explain that Fairhold generated a court-ready evidence PDF containing timestamped photos, the signed checkout agreement, and deterministic formulas, dropping any unverified claims.
4. Click **"Win (Seller)"** to trigger the Sandbox Adjudicate API, resolving the dispute in the owner's favor!
5. Return to the homepage. Show the open-source MIT repo badge.

**Voiceover**:
> *"Finally, if a dispute is ever opened, Fairhold correlates it to the rental case file, generates a tamper-evident evidence PDF citing verified photo hashes and signed timestamps, and submits it directly to PayPal's Disputes API. With our sandbox tools, we can adjudicate disputes in seconds.*
>
> *Fairhold is deployed on Render via an infrastructure blueprint, integrates Channel3 for market replacement prices, and runs on pure deterministic code where money math is never left to an LLM. Thank you!"*
