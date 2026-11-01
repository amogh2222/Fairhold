# Fairhold • Architectural & Technical Decisions Log

This document records technical decisions made during the design and implementation of Fairhold, referencing official documentation from PayPal, Google/Anthropic AI SDKs, Bryntum, AG Grid, Render, and Channel3.

---

## Decision 1: PayPal Web SDK v6 Integration Pattern
- **Context**: PayPal v6 Web SDK introduces a component-based loading architecture with `<paypal-button>` web components and `window.paypal.createInstance()`.
- **Decision**: Load `https://www.sandbox.paypal.com/web-sdk/v6/core` dynamically in a dedicated React client wrapper with singleton guards to prevent double-initialization in React 18 Strict Mode.
- **Reference**: Official PayPal v6 Web SDK sample repository (`paypal-examples/v6-web-sdk-sample-integration`).

## Decision 2: Dual Mode for Single Capture vs Multiple Capture
- **Context**: In PayPal Sandbox, some buyer wallets or card profiles restrict multiple partial captures against a single authorization.
- **Decision**: Default to "Capture at Return" (`final_capture=true` in a single capture for rental fee + verified damage at settlement, releasing any remaining hold immediately). The setting "Charge rental fee at pickup" is provided as an optional business configuration.
- **Principle**: P1 (Money moves only through PayPal) and P5 (Nothing is captured until renter accepts or contest window ends).

## Decision 3: Deterministic Code for Money, Timing, and Eligibility
- **Context**: LLMs are non-deterministic, can suffer rounding errors, and may hallucinate arithmetic.
- **Decision**: All fee sums, damage calculations (`rateCard` or percentage of replacement value), contest window expiration timestamps, and chargeability conditions (`isChargeable = (classification === 'NEW_DAMAGE' || classification === 'MISSING_PART') && confidence >= threshold`) are strictly implemented in deterministic TypeScript functions with comprehensive Vitest unit tests.
- **Principle**: P7.

## Decision 4: Bryntum Scheduler Integration in Next.js App Router
- **Context**: Bryntum Scheduler requires DOM element attachment and client-side window objects not available during Server-Side Rendering (SSR).
- **Decision**: Use dynamic client-only mounting with `next/dynamic` or `useEffect` refs wrapping `@bryntum/scheduler-trial`. Timeline events are keyed to item IDs, colored by booking state, and display honor-period end and expiration milestones.

## Decision 5: AG Studio & PayPal Agent Toolkit for Owner Analytics
- **Context**: Owner analytics requires real-time aggregation of booking financials (held deposits, damage revenue, fairness ratio) plus natural-language inquiry.
- **Decision**: Combine AG Grid custom KPI widgets with the Studio Agent framework powered by `@paypal/agent-toolkit` (providing read-only tools: `get_order`, `list_transactions`, `list_disputes`).

## Decision 6: Render Background Worker & Workflows
- **Context**: Scheduled reauthorizations, contest-window expirations, and dispute synchronization need reliable async execution.
- **Decision**: Implement background tasks as a Node.js worker process specified in `render.yaml` alongside a cron task trigger, backing the queue with PostgreSQL for guaranteed idempotency.

## Decision 7: Multi-Provider AI Architecture via Vercel AI SDK
- **Context**: Project requires Google Gemini by default (`@ai-sdk/google`) and Anthropic Claude (`@ai-sdk/anthropic`) as an alternative, controlled via `LLM_PROVIDER`.
- **Decision**: Utilize Vercel AI SDK's unified `generateObject` and `generateText` with `zod` schemas and temperature 0. Vision tasks pass image URLs or base64 buffers directly. Normalized bounding boxes use the vision model's native `[ymin, xmin, ymax, xmax]` coordinate system (0-1000 scale) mapped to SVG overlay coordinates.
