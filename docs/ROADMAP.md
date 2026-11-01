# Fairhold • Product & Engineering Roadmap

This document outlines the post-hackathon vision and technical milestones for Fairhold.

---

## Phase 1: Core Hackathon Launch (Complete)
- [x] PayPal v6 Web SDK single-authorization hold workflow (`intent: AUTHORIZE`).
- [x] Check-out baseline inspection with pre-existing mark detection and digital signature acknowledgment.
- [x] Ghost overlay return inspection with AI condition comparison (blind to owner desired charge).
- [x] Deterministic charge eligibility engine enforcing Principles P2, P3, P4, P7.
- [x] Deterministic rate card & replacement value pricing engine with deposit capping.
- [x] Single capture at return (`final_capture: true`) releasing held funds immediately.
- [x] PayPal Disputes v1 integration with tamper-evident PDF dossier generation.
- [x] Bryntum Scheduler for gear allocation and PayPal honor/auth expiry tracking.
- [x] AG Grid Community & AG Studio Analytics with PayPal Agent Toolkit natural language query agent.
- [x] Channel3 market replacement price lookup API.
- [x] Render Blueprint configuration (`render.yaml`) with background reauthorization cron.

---

## Phase 2: Autonomous Fleet & IoT (Q1 2027)
1. **IoT Smart Locker Integration**:
   - Integration with smart locker hardware (e.g. Raspberry Pi + electromagnetic locks).
   - Return doors unlock automatically only after return photo QA passes.
2. **Continuous Video 360 Turntable Analysis**:
   - Allow owners to place camera bodies or lenses on an motorized turntable for a 30-second 4K video scan.
   - 3D photogrammetry mesh reconstruction to pinpoint sub-millimeter chassis dings.
3. **Multi-Currency Global Settlements**:
   - Enable European and UK rental houses with multi-currency PayPal balances (EUR, GBP, CAD).
   - Automated FX conversion rate locks at authorization time.

---

## Phase 3: Commercial Insurance & Underwriting (Q2 2027)
1. **Inland Marine Insurance Telematics**:
   - Automated export of Fairhold forensic condition dossiers to commercial underwriters (e.g. Athos, Front Row Insurance).
   - Deductible reimbursement claims filed automatically when damage exceeds security deposit cap.
2. **Decentralized Reputation Protocol**:
   - Portable renter condition scores based on verified on-time returns with zero damage.
   - Renters with perfect 5-star condition records qualify for zero-deposit rentals backed by Fairhold micro-guarantees.
