# Fairhold • Devpost Hackathon Submission Package

Copy and paste the sections below directly into your Devpost project submission for the **"Build What's Next with PayPal and AI"** Hackathon.

---

### Project Title
**Fairhold**

### Tagline (140 characters max)
**Rental deposits that settle themselves fairly via PayPal holds and AI condition comparison. Evidence both sides can see, settled in seconds.**

---

### About the Project

#### 💡 Inspiration
When people rent cameras, drones, e-bikes, tents, or audiovisual production equipment, the security deposit becomes an adversarial battleground at return. Renters fear being blamed for scratches that were already there or for normal cosmetic wear. Owners struggle to prove exactly when physical damage occurred without expensive forensic logging. Traditional rental contracts either absorb damage losses or drag both parties into hostile disputes where merchants absorb chargebacks by default.

We asked: **What if equipment deposits settled themselves fairly?**  
What if PayPal held the funds safely without transferring money, AI objectively documented baseline condition at pick-up and compared it against the return, renters were protected from pre-existing marks and wear-and-tear by deterministic code, and uncharged deposit funds were released automatically in seconds?

That is **Fairhold**.

---

#### 🚀 What It Does
Fairhold replaces subjective rental deposit disputes with an automated, transparent 4-step lifecycle:

1. **One-Click PayPal Authorization Hold (`intent: AUTHORIZE`)**:
   A renter reserves gear on the public storefront (`/b/[slug]`). One approval via the **PayPal v6 Web SDK** creates a single order holding both the rental fee and the security deposit. Crucially, **no money moves from the renter's account**—funds are strictly reserved on hold.
2. **Baseline Condition Report & Signed Handover**:
   At gear pick-up, the owner captures standardized inspection angles using Fairhold's guided viewfinder with real-time AI Photo QA (verifying focus, lighting, and framing). A multimodal vision model (Gemini 2.0 Flash) catalogs all pre-existing blemishes with normalized bounding boxes $[ymin, xmin, ymax, xmax]$. The renter reviews the baseline on their secure portal (`/r/[token]`) and signs digitally with a typed legal signature and timestamp.
3. **Ghost Viewfinder Return Inspection**:
   When equipment is returned, Fairhold's camera renders a semi-transparent **ghost overlay of the baseline photo** directly over the live camera viewfinder, allowing the inspector to line up the return angle precisely. An AI comparison model compares the baseline/return pair **blind to the owner's desired charge**, categorizing every visual difference into `NEW_DAMAGE`, `PRE_EXISTING`, `WEAR_AND_TEAR`, or `DIRT_OR_LIGHTING`.
4. **Deterministic Settlement & Instant Release (Principles P1–P7)**:
   All eligibility and pricing rules are pure deterministic code. If the return is clean, 100% of the deposit is released in seconds. If damage is proven, deterministic code matches the item's Rate Card or applies severity percentages of replacement value (sourced via Channel3), hard-capped at the deposit amount. A single PayPal capture is executed with `final_capture=true`, which automatically releases the remaining held deposit immediately!
5. **Tamper-Evident PayPal Dispute Dossiers**:
   If a dispute is ever opened, Fairhold correlates it via `seller_transaction_id == captureId`, compiles the signed checkout agreement, timestamped photos, and deterministic formulas into a court-ready PDF dossier, and submits it directly via the PayPal Disputes API.

---

#### 🛠️ How We Built It
- **Frontend & Full-Stack Core**: Next.js 15 (App Router), React 18, TypeScript, and Tailwind CSS.
- **PayPal Developer Integration**:
  - **PayPal v6 Web SDK**: Client-side initialization via `paypal.createInstance` rendering `<paypal-button>` web component with `presentationMode: "auto"`.
  - **Orders v2 REST API**: Server-side order creation with `intent: "AUTHORIZE"`.
  - **Payments v2 REST API**: Just-in-time reauthorizations before capture, voiding on cancellation, and single settlement capture with `final_capture=true`.
  - **Customer Disputes v1 REST API**: Programmatic evidence dossier uploads (multipart JSON + generated PDF) and sandbox adjudication.
  - **PayPal Webhooks v1**: Asynchronous signature verification and idempotent event deduplication.
  - **PayPal Agent Toolkit**: Live financial intelligence integrated into our AG Studio analytics dashboard.
- **Multimodal AI Vision & NLP**:
  - Vercel AI SDK (`ai`) with `@ai-sdk/google` (Gemini 2.0 Flash) and `@ai-sdk/anthropic` (Claude 3.5 Sonnet).
  - Temperature 0, structured Zod schemas, and automatic 1-retry fallback.
  - Computer vision prompt engineering for bounding box coordinate detection and blind delta comparisons.
- **Deterministic Guardrails Engine**: Custom timing, state machine, and pricing libraries enforcing the 7 Fairhold principles in code, never delegating financial calculations to the LLM.
- **Sponsor Technologies**:
  - **AG Grid's AG Studio**: Custom KPI widgets (Deposits Held, Released, Damage Revenue, Fairness Ratio) + interactive AG Grid Community table + natural language analytics agent.
  - **Bryntum Scheduler**: Resource timeline tracking equipment allocation, 72h honor period countdown, and 29d auth expiry with drag-drop duration limits.
  - **Render**: Infrastructure blueprint (`render.yaml`) orchestrating web service, managed PostgreSQL, and background reauthorization cron.
  - **Channel3**: Real-time market replacement value lookup with 7-day TTL caching.
  - **pdf-lib**: Dynamic tamper-evident PDF evidence dossier generation with strict `sourceId` claim verification.

---

#### ⚖️ The 7 Non-Negotiable Product Principles Enforced in Code
- **P1. Money Moves Only Through PayPal**: Hold, capture, void, reauthorize, refund via official PayPal REST APIs.
- **P2. Photo Evidence Mandatory**: Nothing is charged without photo evidence citing coordinates and photo SHA-256 hashes.
- **P3. Pre-Existing Marks & Wear Protected**: Renters are never charged for marks acknowledged at checkout or normal wear & tear defined in the owner's policy.
- **P4. AI Proposes, Humans Decide**: Findings marked `UNCERTAIN` can never be charged without written owner justification.
- **P5. No Capture Before Contest Window**: Nothing captured until renter accepts or the 24h contest window elapses.
- **P6. Immutable Audit Trail**: Every event is logged with actor, timestamp, and payload.
- **P7. Deterministic Pricing**: All math, timing rules, and rate cards are deterministic code. The LLM never calculates money.

---

#### 🏆 Sponsor Prizes Targeted & How We Qualify

1. **PayPal Developer APIs (Grand Prize / Core Category)**:
   - Full implementation of Orders v2 (`intent: AUTHORIZE`), Payments v2 (`final_capture: true`, `void`, `reauthorize`), Disputes v1, Webhook verification, and PayPal Agent Toolkit tools. Neither PayPal nor AI is decorative—they form the core transaction engine.
2. **AG Grid / AG Studio Prize**:
   - Custom analytics dashboard at `/owner/analytics` featuring AG Grid Community v36 with custom sorting, filtering, and live currency formatting, plus custom KPI metric widgets (Fairness Ratio Widget, Deposits Released, Median Settlement Time) and a natural-language query agent.
3. **Bryntum Prize**:
   - Production Bryntum Scheduler component at `/owner/schedule` rendering equipment resources, status-colored booking bars, visual markers for the 72-hour PayPal honor period and 29-day authorization expiry, and drag-resize guards enforcing the 25-day rental cap.
4. **Render Prize**:
   - Infrastructure declared via `render.yaml` with a Node web service, managed PostgreSQL, and an automated background cron worker checking and renewing authorizations before the 72-hour honor period expires.
5. **Channel3 Prize**:
   - Live replacement value lookups (`/api/items/channel3-lookup`) connecting equipment catalog items to real-time retail market prices with cached fallbacks.

---

#### 🧪 Accomplishments We're Proud Of
- **100% Deterministic Guarantee**: Successfully eliminating LLM hallucination risk from pricing and charge eligibility by designing a deterministic rules engine.
- **Single-Capture Release**: Leveraging PayPal's `final_capture=true` flag so a single API call simultaneously charges damage and automatically frees the remaining deposit hold.
- **Ghost Viewfinder Overlay**: Building a seamless mobile-first camera interface that renders semi-transparent baseline photos over live video streams for exact angle alignment.
- **18/18 Passing Unit Tests**: Comprehensive verification covering timing math, state transitions, eligibility rules, pricing formulas, webhook deduplication, and PDF claim filtering.

---

#### 🔮 What's Next for Fairhold
- **IoT Smart Locker Integration**: Automated lock release upon return photo QA verification.
- **Continuous 360 Turntable Video Analysis**: 30-second 4K turntable scans with 3D photogrammetry.
- **Automated Inland Marine Insurance Telematics**: Exporting Fairhold forensic dossiers to commercial underwriters when damage exceeds the deposit cap.
- **Global Multi-Currency Settlements**: Supporting international rental houses across EUR, GBP, and CAD balances via PayPal.

---

### Built With (Devpost Tags)
`paypal`, `paypal-developer`, `ai`, `gemini-api`, `next.js`, `typescript`, `ag-grid`, `bryntum`, `render`, `channel3`, `tailwind-css`, `prisma`, `pdf-lib`, `vitest`
