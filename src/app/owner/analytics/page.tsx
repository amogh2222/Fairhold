"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  ClientSideRowModelModule,
} from "ag-grid-community";
import {
  BarChart3,
  ShieldCheck,
  DollarSign,
  Clock,
  Sparkles,
  Send,
  Scale,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

// Register AG Grid Community modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export default function OwnerAnalyticsPage() {
  const [metrics, setMetrics] = useState<any>({
    totalBookings: 8,
    activeHoldsCount: 3,
    settledBookingsCount: 4,
    disputedBookingsCount: 0,
    totalHeldAmountDollars: 3600,
    totalDamageCapturedDollars: 175,
    totalDepositsReleasedDollars: 3425,
    fairnessRatioPercent: 88,
  });

  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  // Row data for AG Grid
  const [rowData, setRowData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          const list = (data.bookings || []).map((b: any) => ({
            id: b.id.slice(-6),
            item: b.item?.name || "Gear Item",
            renter: b.renterName,
            status: b.status,
            depositHeld: b.depositAmount,
            damageCaptured: b.proposal?.proposedDamage || 0,
            releasedAmount: b.depositAmount - (b.proposal?.proposedDamage || 0),
            dates: `${new Date(b.startDate).toLocaleDateString()} – ${new Date(b.endDate).toLocaleDateString()}`,
          }));
          setRowData(list);
        }
      } catch (err) {
        console.error("Failed to load AG Grid rows:", err);
      }
    };

    fetchAnalytics();
  }, []);

  // AG Grid Column Definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "item", headerName: "Equipment", flex: 2, minWidth: 160 },
      { field: "renter", headerName: "Renter", flex: 1.5, minWidth: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        cellRenderer: (params: any) => {
          const val = params.value;
          const colorClass =
            val === "SETTLED"
              ? "text-emerald-700 bg-emerald-50"
              : val === "PROPOSED"
              ? "text-amber-700 bg-amber-50"
              : "text-blue-700 bg-blue-50";
          return `<span style="font-weight:700;font-size:11px;padding:2px 6px;border-radius:4px;" class="${colorClass}">${val}</span>`;
        },
      },
      {
        field: "depositHeld",
        headerName: "Held Deposit",
        width: 130,
        valueFormatter: (p: any) => `$${p.value?.toFixed(2)}`,
      },
      {
        field: "damageCaptured",
        headerName: "Damage Captured",
        width: 140,
        valueFormatter: (p: any) => `$${p.value?.toFixed(2)}`,
      },
      {
        field: "releasedAmount",
        headerName: "Deposit Released",
        width: 140,
        valueFormatter: (p: any) => `$${p.value?.toFixed(2)}`,
      },
      { field: "dates", headerName: "Rental Dates", flex: 2, minWidth: 160 },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  // Handle Natural Language Agent Query
  const handleAskAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim()) return;

    setAgentLoading(true);
    setAgentReply(null);

    try {
      const res = await fetch("/api/analytics/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: agentPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgentReply(data.reply);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        setAgentReply("Agent failed to process query.");
      }
    } catch {
      setAgentReply("Network error querying analytics agent.");
    } finally {
      setAgentLoading(false);
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
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                <span>AG Studio Integration</span>
                <span>•</span>
                <span>PayPal Agent Toolkit</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                Deposit Intelligence & Financial Analytics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time visibility into active PayPal authorization holds, dispute risk, and fairness ratios.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                AG Grid Community v36
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Custom KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active PayPal Holds
            </span>
            <div className="text-2xl font-black text-blue-900">
              ${(metrics.totalHeldAmountDollars || 0).toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {metrics.activeHoldsCount || 0} active rentals
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Deposits Released
            </span>
            <div className="text-2xl font-black text-emerald-700">
              ${(metrics.totalDepositsReleasedDollars || 0).toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              Returned in seconds
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Damage Revenue
            </span>
            <div className="text-2xl font-black text-slate-900">
              ${(metrics.totalDamageCapturedDollars || 0).toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Proven new damage</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Fairness Ratio Widget
            </span>
            <div className="text-2xl font-black text-purple-700">
              {metrics.fairnessRatioPercent || 88}%
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              100% deposit return rate
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Median Settlement Time
            </span>
            <div className="text-2xl font-black text-sky-700">4.2 min</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Inspection to release</span>
          </div>
        </div>

        {/* AG Studio Natural Language AI Agent */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950 rounded-2xl p-6 text-white shadow-xl border border-blue-900/60 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AG Studio Analytics Agent</h3>
              <p className="text-xs text-sky-200/80">
                Powered by PayPal Agent Toolkit • Inspects active authorizations, disputes, and wear-and-tear policies
              </p>
            </div>
          </div>

          <form onSubmit={handleAskAgent} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., 'What is our deposit retention rate this month and how can we reduce contest rates?'"
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="submit"
              disabled={agentLoading}
              className="px-5 py-3 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentLoading ? (
                <span>Analyzing...</span>
              ) : (
                <>
                  <span>Ask Studio</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap gap-2 text-[11px] text-sky-200">
            <span className="text-white/60">Try asking:</span>
            {[
              "Summarize our active PayPal holds and dispute risk",
              "Which gear items have the highest rate of wear-and-tear findings?",
              "What is our median settlement turnaround time?",
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAgentPrompt(q)}
                className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors border border-white/10"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Agent Reply Box */}
          {agentReply && (
            <div className="bg-slate-900/90 rounded-xl p-4 border border-sky-500/30 text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
              <div className="font-bold text-sky-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Studio Agent Insight:</span>
              </div>
              <div className="text-slate-300">{agentReply}</div>
            </div>
          )}
        </div>

        {/* AG Grid Rental Ledger */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Settlement Audit Grid</h3>
              <p className="text-xs text-slate-500">
                Interactive AG Grid community table with column sorting, filtering, and live currency formatting.
              </p>
            </div>
          </div>

          <div className="ag-theme-quartz w-full h-[400px] rounded-xl overflow-hidden">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
