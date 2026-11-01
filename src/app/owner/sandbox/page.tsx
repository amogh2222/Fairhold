"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Terminal,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Scale,
  Download,
  AlertCircle,
} from "lucide-react";

export default function OwnerSandboxPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      const res = await fetch("/api/disputes");
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (e) {
      console.error("Disputes error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleSyncDisputes = async () => {
    setActionLoading("sync");
    setStatusMessage(null);
    try {
      const res = await fetch("/api/disputes", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Synced with PayPal. ${data.syncedCount || 0} new disputes correlated.`);
        await fetchDisputes();
      } else {
        alert(data.error || "Sync failed");
      }
    } catch (err: any) {
      alert("Sync error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleProvideEvidence = async (disputeId: string) => {
    setActionLoading("evidence_" + disputeId);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/provide-evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrativeNote: "Forensic rental agreement dossier with signed baseline condition photos and return damage comparison.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Evidence submitted to PayPal! ${data.claims?.length} verified claims attached.`);
        await fetchDisputes();
      } else {
        alert(data.error || "Failed to submit evidence");
      }
    } catch (err: any) {
      alert("Evidence error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjudicate = async (
    disputeId: string,
    outcome: "RESOLVED_SELLER_FAVOUR" | "RESOLVED_BUYER_FAVOUR"
  ) => {
    setActionLoading("adjudicate_" + disputeId);
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjudicate",
          disputeId,
          outcome,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Dispute ${disputeId} adjudicated: ${outcome}!`);
        await fetchDisputes();
      } else {
        alert(data.error || "Adjudication failed");
      }
    } catch (err: any) {
      alert("Adjudication error: " + err.message);
    } finally {
      setActionLoading(null);
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
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                <span>PayPal Developer Testing Suite</span>
                <span>•</span>
                <span>Sandbox v1 Disputes API</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">PayPal Sandbox Console</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={actionLoading === "sync"}
                onClick={handleSyncDisputes}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === "sync" ? "animate-spin" : ""}`} />
                <span>{actionLoading === "sync" ? "Polling PayPal..." : "Sync Sandbox Disputes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {statusMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Dispute Resolution Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active PayPal Disputes</h3>
              <p className="text-xs text-slate-500">
                Correlated to bookings via <code>seller_transaction_id == captureId</code>. Evidence dossiers dynamically generated with verified sourceId claims.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                <tr>
                  <th className="p-3.5">Dispute ID</th>
                  <th className="p-3.5">Booking / Item</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Dispute Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Sandbox Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading disputes...
                    </td>
                  </tr>
                ) : disputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No active disputes. Settle a booking and click &quot;Sync Sandbox Disputes&quot; to poll PayPal.
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono text-[11px] text-slate-900">
                        {d.paypalDisputeId}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        {d.booking?.item?.name || "Gear Item"}
                      </td>
                      <td className="p-3.5 text-slate-600">{d.reason}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        ${d.disputeAmount?.toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading === "evidence_" + d.id}
                            onClick={() => handleProvideEvidence(d.id)}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1 shadow-sm"
                          >
                            <FileCheck className="w-3 h-3" />
                            Submit PDF Dossier
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === "adjudicate_" + d.paypalDisputeId}
                            onClick={() => handleAdjudicate(d.paypalDisputeId, "RESOLVED_SELLER_FAVOUR")}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          >
                            Win (Seller)
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === "adjudicate_" + d.paypalDisputeId}
                            onClick={() => handleAdjudicate(d.paypalDisputeId, "RESOLVED_BUYER_FAVOUR")}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                          >
                            Buyer Favor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sandbox Fast-Track Help */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>How to Demonstrate PayPal Disputes (Act 3 in Hackathon Brief):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed">
            <li>Book any item from the storefront (authorizes deposit hold).</li>
            <li>Capture return inspection with damage ($175 bayonet scratch) and settle booking.</li>
            <li>In PayPal Sandbox buyer account, open a dispute against the transaction, or trigger customer dispute.</li>
            <li>Click <strong>&quot;Sync Sandbox Disputes&quot;</strong> above to correlate dispute to the booking.</li>
            <li>Click <strong>&quot;Submit PDF Dossier&quot;</strong> — Fairhold packages baseline signed agreement, timestamped photos, and deterministic charge formulas into a court-ready evidence PDF.</li>
            <li>Click <strong>&quot;Win (Seller)&quot;</strong> to call the Sandbox Adjudicate API and settle in seller favor!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
