"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Save,
} from "lucide-react";

export default function OwnerSettingsPage() {
  const [businessName, setBusinessName] = useState("Summit & Shutter Gear Co.");
  const [wearAndTearPolicy, setWearAndTearPolicy] = useState(
    "Superficial scratches under 10mm on non-optical/non-screen surfaces, minor cosmetic rub marks, dust, and expected light wear on grips are considered normal wear and tear and are not chargeable."
  );
  const [contestWindowHours, setContestWindowHours] = useState(24);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(0.75);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <span>Fairhold Policies</span>
            <span>•</span>
            <span>Governance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Rental Policies & AI Rules</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings and policies saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Wear-and-Tear Policy (Principle P3)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              The AI comparison model strictly checks every difference against this definition. Anything covered by this text is automatically non-chargeable.
            </p>
            <textarea
              rows={4}
              value={wearAndTearPolicy}
              onChange={(e) => setWearAndTearPolicy(e.target.value)}
              className="w-full p-3 rounded-xl border text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Contest Window (Hours) (Principle P5)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Time window after return inspection before settlement proposal auto-captures.
              </p>
              <input
                type="number"
                min="1"
                max="72"
                value={contestWindowHours}
                onChange={(e) => setContestWindowHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                AI Confidence Threshold ({Math.round(aiConfidenceThreshold * 100)}%)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Damage findings with AI confidence below this threshold cannot be charged automatically.
              </p>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={aiConfidenceThreshold}
                onChange={(e) => setAiConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full h-2 accent-blue-700 cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Policy Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
