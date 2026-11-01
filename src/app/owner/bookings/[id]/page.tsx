"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Calendar,
  Layers,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Scale,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function BookingCaseFilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSettling, setIsSettling] = useState(false);
  const [settleStatus, setSettleStatus] = useState<string | null>(null);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (e) {
      console.error("Failed to load booking case:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleSettle = async (damageAmount?: number) => {
    setIsSettling(true);
    setSettleStatus(null);
    try {
      const res = await fetch(`/api/settlement/${booking.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settle",
          damageAmount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettleStatus(
          `Settlement complete! Captured $${data.totalCaptured.toFixed(2)}, released $${data.totalReleased.toFixed(2)} remaining deposit.`
        );
        await fetchBooking();
      } else {
        alert(data.error || "Settlement failed");
      }
    } catch (err: any) {
      alert("Settlement error: " + err.message);
    } finally {
      setIsSettling(false);
    }
  };

  const handleApproveProposal = async () => {
    if (!booking.proposal) return;
    try {
      const res = await fetch(`/api/proposals/${booking.proposal.id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchBooking();
      }
    } catch (e) {
      console.error("Approve error:", e);
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
          Loading booking case file...
        </div>
      </div>
    );
  }

  const checkoutInsp = booking.inspections?.find((i: any) => i.type === "CHECKOUT");
  const returnInsp = booking.inspections?.find((i: any) => i.type === "RETURN");
  const activeAuth = booking.authorizations?.[0];
  const proposalBreakdown = booking.proposal?.breakdownJson
    ? typeof booking.proposal.breakdownJson === "string"
      ? JSON.parse(booking.proposal.breakdownJson)
      : booking.proposal.breakdownJson
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <Link href="/owner" className="hover:text-blue-700">
                  Operations
                </Link>
                <span>/</span>
                <span>Case #{booking.id.slice(-6)}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">{booking.item?.name}</h1>
              <div className="text-xs text-slate-500 mt-1">
                Renter: <strong>{booking.renterName}</strong> ({booking.renterEmail})
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  booking.status === "SETTLED"
                    ? "bg-emerald-100 text-emerald-800"
                    : booking.status === "CHECKED_OUT"
                    ? "bg-blue-100 text-blue-800"
                    : booking.status === "PROPOSED"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {booking.status}
              </span>

              <Link
                href={`/r/${booking.renterToken}`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                <span>Renter View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {settleStatus && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{settleStatus}</span>
          </div>
        )}

        {/* Quick Action Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
              <Lock className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400">
                PayPal Authorization Hold
              </div>
              <div className="text-2xl font-black text-blue-900">
                ${booking.totalAuthorized?.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Auth ID: {activeAuth?.paypalAuthId || "Pending"} • Honor Ends:{" "}
                {activeAuth?.honorEndsAt
                  ? new Date(activeAuth.honorEndsAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {booking.status === "HELD" && (
              <Link
                href={`/owner/inspect/${booking.id}/checkout`}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 shadow-sm"
              >
                <Camera className="w-4 h-4" />
                Capture Checkout Baseline
              </Link>
            )}

            {booking.status === "CHECKED_OUT" && (
              <Link
                href={`/owner/inspect/${booking.id}/return`}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm"
              >
                <Camera className="w-4 h-4" />
                Capture Return Inspection (Ghost QA)
              </Link>
            )}

            {booking.status === "PROPOSED" && (
              <>
                <button
                  type="button"
                  onClick={handleApproveProposal}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  Approve Proposal
                </button>
                <button
                  type="button"
                  disabled={isSettling}
                  onClick={() => handleSettle(booking.proposal?.proposedDamage || 0)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSettling ? "Settling..." : "Execute Settlement & Capture"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inspection Photos & AI Finding Comparisons */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Condition Evidence Gallery</h3>
            <span className="text-xs text-slate-500">
              Checkout Baseline vs Return Inspection
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checkout Photos */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block">
                1. Check-Out Baseline Photos
              </span>
              {checkoutInsp?.photos?.length > 0 ? (
                checkoutInsp.photos.map((p: any) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2"
                  >
                    <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={p.fileUrl}
                        alt="Baseline"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono pt-2">
                      Angle: {p.shotKey}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No checkout inspection photos recorded yet.
                </div>
              )}
            </div>

            {/* Return Photos */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                2. Return Condition Photos
              </span>
              {returnInsp?.photos?.length > 0 ? (
                returnInsp.photos.map((p: any) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2"
                  >
                    <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={p.fileUrl}
                        alt="Return"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono pt-2">
                      Angle: {p.shotKey}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  Return inspection pending return of gear.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settlement Proposal Breakdown */}
        {proposalBreakdown && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Settlement Calculation Breakdown (Principle P7)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <tr>
                    <th className="p-3">Finding Description</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Eligibility Rule</th>
                    <th className="p-3">Formula</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposalBreakdown.lines?.map((l: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-slate-900">{l.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-50 text-rose-700">
                          {l.classification}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {l.method}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{l.formula}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        ${l.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t divide-y">
                  <tr>
                    <td colSpan={4} className="p-3 text-slate-600">Total Damage Charged to Deposit</td>
                    <td className="p-3 text-right text-rose-700">
                      ${proposalBreakdown.cappedDamageAmount?.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-3 text-emerald-800">
                      Deposit Released to Renter via PayPal
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-black">
                      ${proposalBreakdown.totalToRelease?.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Audit Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-bold text-slate-900">Case Audit Trail</h4>
          </div>

          <div className="space-y-3">
            {booking.auditEvents?.map((event: any) => (
              <div key={event.id} className="flex items-start gap-3 text-xs">
                <span className="font-mono text-slate-400 text-[10px] whitespace-nowrap mt-0.5">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {event.actor}
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-slate-800">{event.eventType}</span>
                  {event.details && (
                    <div className="text-slate-500 text-[11px] font-mono mt-0.5 truncate max-w-xl">
                      {event.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
