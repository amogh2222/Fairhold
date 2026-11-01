"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Shield,
  Layers,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function OwnerSchedulePage() {
  const schedulerContainerRef = useRef<HTMLDivElement>(null);
  const [schedulerInstance, setSchedulerInstance] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    const loadDataAndScheduler = async () => {
      try {
        // 1. Fetch items & bookings
        const [itemsRes, bookingsRes] = await Promise.all([
          fetch("/api/items"),
          fetch("/api/bookings"),
        ]);

        const itemsData = await itemsRes.json();
        const bookingsData = await bookingsRes.json();

        const fetchedItems = itemsData.items || [];
        const fetchedBookings = bookingsData.bookings || [];

        setItems(fetchedItems);
        setBookings(fetchedBookings);

        // 2. Dynamically import Bryntum Scheduler on client only
        if (typeof window !== "undefined" && schedulerContainerRef.current) {
          try {
            // Import Bryntum Scheduler styles and module
            // @ts-ignore
            await import("@bryntum/scheduler-trial/scheduler.css");
            // @ts-ignore
            await import("@bryntum/scheduler-trial/stockholm-light.css");
            // @ts-ignore
            const { Scheduler } = await import("@bryntum/scheduler-trial");

            // Format resources (items)
            const resources = fetchedItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              dailyRate: item.dailyRate,
            }));

            // Format events (bookings) with honor-period / auth-expiry metadata
            const events = fetchedBookings.map((b: any) => {
              const start = new Date(b.startDate);
              const end = new Date(b.endDate);
              const authCreated = new Date(b.createdAt);
              const honorEnds = new Date(authCreated.getTime() + 3 * 24 * 60 * 60 * 1000);
              const authExpires = new Date(authCreated.getTime() + 29 * 24 * 60 * 60 * 1000);

              let eventColor = "blue";
              if (b.status === "SETTLED") eventColor = "green";
              else if (b.status === "CHECKED_OUT") eventColor = "cyan";
              else if (b.status === "PROPOSED" || b.status === "CONTESTED") eventColor = "orange";
              else if (b.status === "DISPUTED") eventColor = "red";

              return {
                id: b.id,
                resourceId: b.itemId,
                name: `${b.renterName} ($${b.depositAmount} Hold)`,
                startDate: start,
                endDate: end,
                eventColor,
                status: b.status,
                renterName: b.renterName,
                depositAmount: b.depositAmount,
                honorEnds: honorEnds.toISOString(),
                authExpires: authExpires.toISOString(),
              };
            });

            // Clean container
            schedulerContainerRef.current.innerHTML = "";

            const scheduler = new Scheduler({
              appendTo: schedulerContainerRef.current,
              height: 520,
              resources,
              events,
              columns: [
                {
                  text: "Gear Item",
                  field: "name",
                  width: 240,
                  renderer: ({ record }: any) => `<b>${record.name}</b>`,
                },
                {
                  text: "Category",
                  field: "category",
                  width: 120,
                },
                {
                  text: "Daily Rate",
                  field: "dailyRate",
                  width: 100,
                  renderer: ({ record }: any) => `$${record.dailyRate}/day`,
                },
              ],
              startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              viewPreset: "dayAndWeek",
              barMargin: 8,
              eventRenderer({ eventRecord }: any) {
                return `
                  <div style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;">
                    <span>${eventRecord.name}</span>
                    <span style="opacity:0.8;font-size:9px;background:rgba(0,0,0,0.2);padding:1px 4px;border-radius:3px;">${eventRecord.status}</span>
                  </div>
                `;
              },
              onEventClick({ eventRecord }: any) {
                setSelectedBooking(eventRecord);
              },
              // Enforce Fixed Hold Amount Guard on Drag / Resize
              onBeforeEventResize({ eventRecord, newEndDate }: any) {
                const start = eventRecord.startDate.getTime();
                const end = newEndDate.getTime();
                const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
                if (days > 25) {
                  alert("Duration capped at 25 days to preserve PayPal authorization lifespan.");
                  return false;
                }
                return true;
              },
            });

            setSchedulerInstance(scheduler);
          } catch (bryntumErr) {
            console.warn("Bryntum scheduler mounting fallback:", bryntumErr);
          }
        }
      } catch (err) {
        console.error("Scheduler setup failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDataAndScheduler();

    return () => {
      if (schedulerInstance && typeof schedulerInstance.destroy === "function") {
        schedulerInstance.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                <span>Bryntum Scheduler Integration</span>
                <span>•</span>
                <span>Gear Reservation & Authorization Timeline</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">Rental Equipment Schedule</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Visual timeline tracking PayPal 3-day honor periods, 29-day auth expiries, and scheduled reauthorizations.
              </p>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> HELD
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> CHECKED OUT
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> PROPOSED
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> SETTLED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        {/* Scheduler Element */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          {loading && (
            <div className="p-16 text-center text-slate-400 text-sm">
              Initializing Bryntum Scheduler & loading live reservations...
            </div>
          )}

          <div ref={schedulerContainerRef} className="w-full min-h-[480px]" />
        </div>

        {/* Selected Booking Drawer / Details Card */}
        {selectedBooking && (
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Selected Reservation
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {selectedBooking.name}
              </h3>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                <span>Renter: <strong>{selectedBooking.renterName}</strong></span>
                <span>Deposit: <strong>${selectedBooking.depositAmount}</strong></span>
                <span>Status: <strong>{selectedBooking.status}</strong></span>
                <span>
                  Dates: {new Date(selectedBooking.startDate).toLocaleDateString()} – {new Date(selectedBooking.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/owner/bookings/${selectedBooking.id}`}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-sm"
              >
                Open Full Case File
              </Link>
            </div>
          </div>
        )}

        {/* PayPal Timing Rules Infobox */}
        <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-200/80 text-xs text-blue-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Shield className="w-4 h-4 text-blue-700" />
            <span>PayPal Authorization Lifespan & Reauthorization Rules Enforced:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li><strong>72-Hour (3-Day) Honor Period:</strong> PayPal guarantees authorized funds for 3 days without reauthorization.</li>
            <li><strong>Scheduled Reauthorizations:</strong> Fairhold automatically triggers reauthorization 6 hours before honor period expiry for rentals over 3 days.</li>
            <li><strong>25-Day Rental Cap:</strong> Hard guard prevents extension beyond 25 days to remain safely within PayPal&apos;s 29-day max authorization limit.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
