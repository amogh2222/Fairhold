"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Camera,
  Layers,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Lock,
  FileCheck,
  Scale,
  Sparkles,
  BarChart,
  Calendar,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistConsent, setWaitlistConsent] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistConsent) {
      alert("Please accept the data processing consent.");
      return;
    }
    setWaitlistLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, consent: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistStatus("Success! You've been added to the early access list.");
        setWaitlistEmail("");
      } else {
        setWaitlistStatus(data.error || "Failed to join waitlist.");
      }
    } catch {
      setWaitlistStatus("Network error. Please try again.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleWaitlistDelete = async () => {
    if (!waitlistEmail) {
      alert("Please enter your email above to delete your waitlist entry.");
      return;
    }
    try {
      const res = await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      setWaitlistStatus(data.message);
    } catch {
      setWaitlistStatus("Network error.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>PayPal & AI Hackathon 2026 • PayPal Developer Challenge</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Rental deposits that{" "}
            <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              settle themselves fairly
            </span>
            .
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            PayPal holds the deposit, AI compares item condition at check-out and return, the renter is charged only for proven new damage, and the rest is released in seconds.
          </p>

          {/* Quick Demo CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/b/summit-shutter"
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-700 to-sky-600 text-white hover:from-blue-800 hover:to-sky-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Demo Storefront</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/owner"
              className="w-full sm:w-auto px-7 py-4 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Owner Operations</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </Link>
          </div>

          {/* Judge Fast-Track Banner */}
          <div className="mt-12 max-w-3xl mx-auto bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-sm text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-black">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Judge Fast-Track Walkthrough</div>
                <div className="text-xs text-slate-500">
                  Pre-configured demo with 8 gear items, real PayPal Sandbox orders, and forensic photo pairs.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href="/owner/schedule"
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-center transition-colors"
              >
                Bryntum Schedule
              </Link>
              <Link
                href="/owner/analytics"
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-center transition-colors shadow-sm"
              >
                AG Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Core Mechanic */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Deterministic Settlement Architecture
            </span>
            <h2 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
              The 4-Step Fairhold Lifecycle
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              From reservation hold to return release, every dollar moves with verifiable proof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">One-Click PayPal Hold</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Renter approves <strong>intent: AUTHORIZE</strong>. PayPal holds the rental fee + security deposit. Funds remain untouched until return.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-black flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Baseline Condition Report</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Owner captures standardized angles. AI catalogs pre-existing marks. Renter signs the baseline report via secure link before pickup.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Ghost Return Inspection</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Ghost overlay lines up return shots with baseline photos. AI compares pairs, strictly separating new damage from wear & tear.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Instant Fair Settlement</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Deterministic code computes rate card or severity charges. PayPal captures verified damage with <strong>final_capture=true</strong>, releasing remainder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Non-Negotiable Product Principles (P1 - P7) */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Guaranteed Protections
            </span>
            <h2 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
              Fairhold Principles Enforced in Code
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Rules enforced mathematically in code, never left to LLM prompt persuasion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>P1. Money Moves Only Via PayPal</span>
              </div>
              <p className="text-xs text-slate-600">
                Hold, capture, void, reauthorize, and refund flow exclusively through documented PayPal REST APIs.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                <Camera className="w-4 h-4 text-sky-600" />
                <span>P2. Photo Evidence Mandatory</span>
              </div>
              <p className="text-xs text-slate-600">
                Nothing is charged without photo evidence. Every line item cites normalized bounding box coordinates and photo hashes.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>P3. Pre-Existing & Wear Protected</span>
              </div>
              <p className="text-xs text-slate-600">
                Renters are never charged for marks acknowledged at checkout or normal wear & tear defined in the owner's written policy.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>P4. AI Proposes, Humans Decide</span>
              </div>
              <p className="text-xs text-slate-600">
                Owners approve proposals; renters can accept or contest. Anything marked UNCERTAIN cannot be auto-charged.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>P5. No Capture Before Contest Window</span>
              </div>
              <p className="text-xs text-slate-600">
                Nothing is captured until the renter accepts or the business contest window expires (default 24h).
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                <DollarSign className="w-4 h-4 text-blue-800" />
                <span>P7. Deterministic Pricing Math</span>
              </div>
              <p className="text-xs text-slate-600">
                All rate cards, replacement percentages, and deposit caps are pure deterministic code. The LLM never calculates money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Deploy Fairhold to Your Rental Fleet
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Join gear owners and camera rental houses settling deposits transparently.
          </p>

          <form onSubmit={handleWaitlistSubmit} className="mt-8 space-y-4 max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="owner@yourgearshop.com"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={waitlistLoading}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-md disabled:opacity-50"
              >
                {waitlistLoading ? "Joining..." : "Join Pilot"}
              </button>
            </div>

            <div className="flex items-start gap-2 text-left">
              <input
                type="checkbox"
                id="consentCheck"
                checked={waitlistConsent}
                onChange={(e) => setWaitlistConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-400">
                I agree to receive Fairhold pilot updates. You may request immediate data deletion anytime via the button below (GDPR/CCPA compliant).
              </label>
            </div>

            {waitlistStatus && (
              <div className="text-xs font-semibold text-sky-300 pt-2">{waitlistStatus}</div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleWaitlistDelete}
                className="text-[11px] text-slate-500 hover:text-slate-400 underline transition-colors"
              >
                Forget my email / Delete my waitlist record
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>Fairhold • Built for "Build What's Next with PayPal and AI" Devpost Hackathon 2026</p>
        <p className="mt-1">
          Targeting PayPal Developer APIs • AG Grid AG Studio • Bryntum Scheduler • Render • Channel3
        </p>
      </footer>
    </div>
  );
}
