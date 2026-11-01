"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";

export default function OwnerOperationsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error("Failed to load bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalHeld = bookings
    .filter((b) => ["HELD", "CHECKED_OUT", "RETURNED", "INSPECTING", "PROPOSED", "CONTESTED"].includes(b.status))
    .reduce((sum, b) => sum + (b.depositAmount || 0), 0);

  const pendingProposals = bookings.filter((b) => b.status === "PROPOSED").length;
  const activeRentals = bookings.filter((b) => b.status === "CHECKED_OUT").length;
  const readyForPickup = bookings.filter((b) => b.status === "HELD").length;

  const filtered = bookings.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Operations Dashboard Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                <span>Summit & Shutter Gear Co.</span>
                <span>•</span>
                <span>Rental Ops</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">Today&apos;s Equipment Operations</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchBookings}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>

              <Link
                href="/b/summit-shutter"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Storefront Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Deposits Held
            </span>
            <div className="text-2xl font-black text-blue-900">${totalHeld.toFixed(2)}</div>
            <span className="text-xs text-slate-500 mt-1 block">In PayPal Sandbox hold</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Ready for Checkout Baseline
            </span>
            <div className="text-2xl font-black text-slate-900">{readyForPickup}</div>
            <span className="text-xs text-sky-600 mt-1 block">Held • Awaiting photo capture</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Currently Checked Out
            </span>
            <div className="text-2xl font-black text-emerald-700">{activeRentals}</div>
            <span className="text-xs text-slate-500 mt-1 block">Active gear in field</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Settlement Proposals Pending
            </span>
            <div className="text-2xl font-black text-amber-700">{pendingProposals}</div>
            <span className="text-xs text-slate-500 mt-1 block">Returned • In contest window</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {["ALL", "HELD", "CHECKED_OUT", "RETURNED", "PROPOSED", "SETTLED", "DISPUTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filter === st
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Item & Renter</th>
                <th className="p-4">Rental Dates</th>
                <th className="p-4">Held Deposit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Inspection & Case File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No bookings found in this status.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{b.item?.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {b.renterName} • {b.renterEmail}
                      </div>
                    </td>

                    <td className="p-4">
                      <div>
                        {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-slate-400 text-[10px]">Fee: ${b.rentalFee?.toFixed(2)}</div>
                    </td>

                    <td className="p-4 font-bold text-blue-900">${b.depositAmount?.toFixed(2)}</td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === "SETTLED"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "CHECKED_OUT"
                            ? "bg-blue-100 text-blue-800"
                            : b.status === "PROPOSED"
                            ? "bg-amber-100 text-amber-800"
                            : b.status === "HELD"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inspection trigger buttons */}
                        {b.status === "HELD" && (
                          <Link
                            href={`/owner/inspect/${b.id}/checkout`}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Checkout QA
                          </Link>
                        )}

                        {b.status === "CHECKED_OUT" && (
                          <Link
                            href={`/owner/inspect/${b.id}/return`}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Return Ghost QA
                          </Link>
                        )}

                        <Link
                          href={`/owner/bookings/${b.id}`}
                          className="px-3 py-1.5 rounded-lg font-semibold text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Case File
                        </Link>

                        <Link
                          href={`/r/${b.renterToken}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          title="View Renter Portal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

