"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Layers,
  FileCheck,
  DollarSign,
  Scale,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function RenterPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Acknowledgment form state (Checkout)
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  // Contest form state
  const [showContestDrawer, setShowContestDrawer] = useState(false);
  const [contestedFindingId, setContestedFindingId] = useState<string | null>(null);
  const [contestComment, setContestComment] = useState("");
  const [isContesting, setIsContesting] = useState(false);

  // Settle form state
  const [isAccepting, setIsAccepting] = useState(false);
  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings?renterToken=${token}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      } else {
        setError("Invalid or expired rental booking link.");
      }
    } catch {
      setError("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [token]);

  // Handle Renter Signs Baseline
  const handleSignBaseline = async () => {
    if (!agreeChecked || !typedSignature.trim()) {
      alert("Please confirm the agreement and enter your typed full name.");
      return;
    }
    setIsSigning(true);
    try {
      const res = await fetch("/api/inspections/checkout/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          renterSignature: typedSignature.trim(),
        }),
      });
      if (res.ok) {
        await fetchBooking();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to sign baseline report");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setIsSigning(false);
    }
  };

  // Handle Accept Settlement
  const handleAcceptSettlement = async () => {
    if (!booking.proposal) return;
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/proposals/${booking.proposal.id}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        setSettlementSuccess("Settlement confirmed! PayPal has released your remaining deposit hold.");
        await fetchBooking();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to accept settlement");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle Submit Contest
  const handleSubmitContest = async () => {
    if (!booking.proposal || !contestedFindingId || !contestComment.trim()) {
      alert("Please enter your statement explaining why this charge should be adjusted.");
      return;
    }
    setIsContesting(true);
    try {
      const res = await fetch(`/api/proposals/${booking.proposal.id}/contest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              findingId: contestedFindingId,
              comment: contestComment.trim(),
            },
          ],
        }),
      });
      if (res.ok) {
        setShowContestDrawer(false);
        setContestComment("");
        await fetchBooking();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit contest");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setIsContesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
          Loading secure rental case file...
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Rental Not Found</h2>
            <p className="text-xs text-slate-500 mt-2">{error || "Please verify your secure link."}</p>
          </div>
        </div>
      </div>
    );
  }

  const checkoutInsp = booking.inspections?.find((i: any) => i.type === "CHECKOUT");
  const returnInsp = booking.inspections?.find((i: any) => i.type === "RETURN");
  const proposalBreakdown = booking.proposal?.breakdownJson
    ? typeof booking.proposal.breakdownJson === "string"
      ? JSON.parse(booking.proposal.breakdownJson)
      : booking.proposal.breakdownJson
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Renter Portal • {booking.business?.name || "Summit & Shutter"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-mono text-slate-500">Booking #{booking.id.slice(-6)}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {booking.item?.name}
              </h1>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  booking.status === "SETTLED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : booking.status === "CHECKED_OUT"
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : booking.status === "PROPOSED"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : booking.status === "CONTESTED"
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : "bg-slate-100 text-slate-800 border border-slate-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                Status: {booking.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Settlement Success Notification */}
        {settlementSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{settlementSuccess}</span>
          </div>
        )}

        {/* Financial Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
              Deposit Held in PayPal
            </span>
            <div className="text-2xl font-black text-blue-900">
              ${booking.depositAmount?.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">Hold only • untouched in your account</span>
          </div>

          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
              Rental Fee
            </span>
            <div className="text-2xl font-black text-slate-900">
              ${booking.rentalFee?.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">
              {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
              Total Authorized Hold
            </span>
            <div className="text-2xl font-black text-emerald-700">
              ${booking.totalAuthorized?.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Released upon verified return
            </span>
          </div>
        </div>

        {/* ACT 1: Checkout Baseline Inspection & Acknowledgment */}
        {booking.status === "HELD" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-500/40 shadow-lg space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                <Camera className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Step 2 • Review Check-Out Baseline Condition
                </h3>
                <p className="text-xs text-slate-500">
                  The owner has recorded the pre-existing marks below. You will never be charged for these marks.
                </p>
              </div>
            </div>

            {/* Baseline Photos Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkoutInsp?.photos?.map((photo: any) => (
                <div key={photo.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2">
                  <div className="relative aspect-[4/3] flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    <img
                      src={photo.fileUrl}
                      alt={photo.shotKey}
                      className="w-full h-full object-contain"
                    />

                    {/* Pre-existing mark bounding boxes */}
                    {photo.baselineMarks?.map((mark: any) => {
                      const top = (mark.boxYmin / 1000) * 100;
                      const left = (mark.boxXmin / 1000) * 100;
                      const height = ((mark.boxYmax - mark.boxYmin) / 1000) * 100;
                      const width = ((mark.boxXmax - mark.boxXmin) / 1000) * 100;

                      return (
                        <div
                          key={mark.id}
                          style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
                          className="absolute border-2 border-amber-400 bg-amber-400/20 rounded pointer-events-none"
                        >
                          <span className="absolute -top-5 left-0 text-[9px] font-bold bg-amber-500 text-slate-950 px-1 rounded uppercase tracking-wider whitespace-nowrap">
                            Pre-Existing: {mark.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 text-xs text-slate-300 font-mono">
                    Angle: {photo.shotKey} • SHA256: {photo.sha256Hash?.slice(0, 12)}...
                  </div>
                </div>
              ))}
            </div>

            {/* Acknowledgment Agreement */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeChecked}
                  onChange={(e) => setAgreeChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-blue-950 leading-relaxed font-medium">
                  I have inspected the item and reviewed the pre-existing condition photos above. I confirm these marks were present before my possession, and I accept the item in this condition.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Type your full legal name to sign"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  disabled={!agreeChecked || !typedSignature.trim() || isSigning}
                  onClick={handleSignBaseline}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSigning ? "Signing..." : "Acknowledge & Sign Check-Out Baseline"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACT 2 & 3: Return Inspection & Settlement Proposal */}
        {(booking.status === "PROPOSED" ||
          booking.status === "CONTESTED" ||
          booking.status === "SETTLED") && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Step 4 • Settlement Proposal
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Return Condition & Charge Breakdown
                </h3>
              </div>

              {booking.proposal && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Contest Deadline</span>
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    {new Date(booking.proposal.renterDeadline).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Side-by-side Inspection Photos & AI Findings */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Side-by-Side Condition Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {returnInsp?.photos?.map((rp: any) => (
                  <div key={rp.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2">
                    <div className="relative aspect-[4/3] flex items-center justify-center bg-black rounded-lg overflow-hidden">
                      <img src={rp.fileUrl} alt="Return photo" className="w-full h-full object-contain" />
                    </div>
                    <div className="pt-2 text-xs text-slate-300 font-mono">
                      Return Angle: {rp.shotKey}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Itemized Settlement Table */}
            {proposalBreakdown && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Finding Description</th>
                      <th className="p-3.5">Classification</th>
                      <th className="p-3.5">Calculation Rule</th>
                      <th className="p-3.5 text-right">Amount Charged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {proposalBreakdown.lines?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-emerald-700 font-semibold">
                          Clean return verified! Zero damage charged. 100% of deposit hold released.
                        </td>
                      </tr>
                    ) : (
                      proposalBreakdown.lines?.map((line: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-medium text-slate-900">{line.description}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                              {line.classification}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">{line.formula}</td>
                          <td className="p-3.5 text-right font-bold text-slate-900">
                            ${line.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-xs divide-y divide-slate-200">
                    <tr>
                      <td colSpan={3} className="p-3.5 text-slate-600">Total Damage Charged to Deposit</td>
                      <td className="p-3.5 text-right text-rose-700">
                        ${proposalBreakdown.cappedDamageAmount?.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3.5 text-emerald-800">Remaining Deposit Hold Released to You</td>
                      <td className="p-3.5 text-right text-emerald-700 font-black text-sm">
                        ${proposalBreakdown.totalToRelease?.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Renter Decision Actions */}
            {booking.status === "PROPOSED" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isAccepting}
                  onClick={handleAcceptSettlement}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isAccepting ? "Finalizing..." : "Accept Proposal & Release Remainder"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowContestDrawer(true)}
                  className="py-3 px-6 rounded-xl font-bold text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  Contest Line Item
                </button>
              </div>
            )}

            {/* Contest Drawer / Modal */}
            {showContestDrawer && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-700" />
                  <h4 className="font-bold text-purple-950 text-sm">Contest a Finding</h4>
                </div>
                <p className="text-xs text-purple-800">
                  Select the line item you wish to contest and provide your factual explanation. An independent AI review will reassess the finding against the check-out baseline.
                </p>

                <select
                  value={contestedFindingId || ""}
                  onChange={(e) => setContestedFindingId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-purple-300 bg-white text-slate-900"
                >
                  <option value="">Select line item to contest...</option>
                  {proposalBreakdown?.lines?.map((line: any) => (
                    <option key={line.findingId} value={line.findingId}>
                      {line.description} (${line.amount})
                    </option>
                  ))}
                </select>

                <textarea
                  rows={3}
                  placeholder="Explain why this mark was pre-existing or covered by the wear-and-tear policy..."
                  value={contestComment}
                  onChange={(e) => setContestComment(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-purple-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContestDrawer(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isContesting}
                    onClick={handleSubmitContest}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-700 text-white hover:bg-purple-800 shadow-sm"
                  >
                    {isContesting ? "Submitting..." : "Submit Contest for Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tamper-Evident Audit Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-bold text-slate-900">Audit Trail (Immutable Ledger)</h4>
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

