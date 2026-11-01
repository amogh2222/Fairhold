"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Layers,
  Sparkles,
  Search,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function OwnerItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New item modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Camera Body");
  const [dailyRate, setDailyRate] = useState("75");
  const [depositAmount, setDepositAmount] = useState("500");
  const [replacementValue, setReplacementValue] = useState("2499");
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [generatedShots, setGeneratedShots] = useState<any[]>([]);
  const [isLookingUpChannel3, setIsLookingUpChannel3] = useState(false);
  const [channel3Sources, setChannel3Sources] = useState<any[]>([]);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // AI Shot List Generator
  const handleGenerateShotList = async () => {
    if (!name.trim()) {
      alert("Please enter an item name first.");
      return;
    }
    setIsGeneratingShots(true);
    try {
      const res = await fetch("/api/items/shot-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedShots(data.shots || []);
      }
    } catch (e: any) {
      alert("AI Shot list generation failed: " + e.message);
    } finally {
      setIsGeneratingShots(false);
    }
  };

  // Channel3 Replacement Value Lookup
  const handleChannel3Lookup = async () => {
    if (!name.trim()) {
      alert("Please enter an item name first.");
      return;
    }
    setIsLookingUpChannel3(true);
    try {
      const res = await fetch("/api/items/channel3-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.medianPrice) {
          setReplacementValue(data.medianPrice.toString());
        }
        setChannel3Sources(data.sources || []);
      }
    } catch (e: any) {
      alert("Channel3 lookup failed: " + e.message);
    } finally {
      setIsLookingUpChannel3(false);
    }
  };

  // Create item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          dailyRate: Number(dailyRate),
          depositAmount: Number(depositAmount),
          replacementValue: Number(replacementValue),
          shotList: generatedShots.length > 0 ? generatedShots : [
            { key: "shot_front", label: "Front Surface & Optics", instructions: "Hold camera 2 feet away. Inspect front glass or controls." },
            { key: "shot_rear", label: "Rear Interface & LCD", instructions: "Capture rear panel, buttons, and ports with direct lighting." },
            { key: "shot_top", label: "Top Dials & Controls", instructions: "Bird's-eye view of upper chassis, dials, or handles." },
            { key: "shot_base", label: "Bottom Base & Mount", instructions: "Inspect bottom surface, tripod mount, or battery door." },
          ],
          rateCard: [
            { damageType: "Deep glass scratch / sensor scratch", price: 350 },
            { damageType: "LCD screen crack or bleed", price: 220 },
            { damageType: "Chassis dent into frame / bent mount", price: 175 },
          ],
          images: ["/items/item_camera.svg"],
          inService: true,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        await fetchItems();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create item");
      }
    } catch (err: any) {
      alert("Creation error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                <span>Fleet Management</span>
                <span>•</span>
                <span>Rate Cards & Shot Lists</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">Equipment Inventory</h1>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Equipment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] rounded-xl bg-slate-100 mb-3 overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={item.images?.[0] || "/items/item_camera.svg"}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {item.category}
                </span>

                <h3 className="font-bold text-slate-900 text-sm mt-1">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Replacement: ${item.replacementValue}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate</span>
                  <span className="font-bold text-slate-900">${item.dailyRate}/day</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deposit</span>
                  <span className="font-bold text-blue-700">${item.depositAmount} hold</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Add Rental Equipment</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony FX3 Cinema Line Camera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-slate-900"
                  >
                    <option value="Camera Body">Camera Body</option>
                    <option value="Lens">Lens</option>
                    <option value="Drone">Drone</option>
                    <option value="Outdoor Gear">Outdoor Gear</option>
                    <option value="Audio / Visual">Audio / Visual</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Rate ($)</label>
                  <input
                    type="number"
                    required
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deposit Hold ($)</label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Replacement Value ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={replacementValue}
                      onChange={(e) => setReplacementValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleChannel3Lookup}
                      disabled={isLookingUpChannel3}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap"
                    >
                      {isLookingUpChannel3 ? "..." : "Channel3"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Channel3 Sources Preview */}
              {channel3Sources.length > 0 && (
                <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 text-[11px]">
                    Channel3 Verified Retail Listings:
                  </span>
                  {channel3Sources.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] text-slate-500">
                      <span>{s.merchant}: {s.title.slice(0, 30)}...</span>
                      <span className="font-bold text-slate-900">${s.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Shot List Generator */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Inspection Shot Checklist</span>
                  <button
                    type="button"
                    onClick={handleGenerateShotList}
                    disabled={isGeneratingShots}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 hover:bg-sky-100"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingShots ? "Generating..." : "AI Generate Shot List"}</span>
                  </button>
                </div>

                {generatedShots.length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border">
                    {generatedShots.map((s, idx) => (
                      <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-sky-600 flex-shrink-0" />
                        <strong>{s.label}:</strong> {s.instructions}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

