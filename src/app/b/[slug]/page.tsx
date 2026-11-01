"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PayPalButtonV6 from "@/components/PayPalButtonV6";
import {
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  DollarSign,
} from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  depositAmount: number;
  replacementValue: number;
  images: string[];
  rateCard: Array<{ damageType: string; price: number }>;
}

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || "summit-shutter";

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const today = new Date().toISOString().split("T")[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(threeDaysLater);
  const [renterName, setRenterName] = useState("Amogh Judge");
  const [renterEmail, setRenterEmail] = useState("judge@hackathon-demo.com");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/items?businessSlug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
          if (data.items?.length > 0) {
            setSelectedItem(data.items[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [slug]);

  // Duration calculation
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isDurationValid = rentalDays > 0 && rentalDays <= 25;

  const rentalFee = selectedItem ? Math.round(selectedItem.dailyRate * rentalDays * 100) / 100 : 0;
  const depositAmount = selectedItem ? selectedItem.depositAmount : 0;
  const totalHoldAmount = Math.round((rentalFee + depositAmount) * 100) / 100;

  const handleBookingSuccess = (data: { bookingId: string; renterToken: string }) => {
    router.push(`/r/${data.renterToken}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Storefront Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
                <span>Verified Rental Partner</span>
                <span>•</span>
                <span>Fairhold Deposit Protection</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Summit & Shutter Gear Co.
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Premium photography, cinema, and expedition rental fleet. Deposits held securely with PayPal.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-200/80 px-4 py-2.5 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <div className="text-xs">
                <div className="font-bold text-blue-900">Protected Deposits</div>
                <div className="text-blue-700">Released automatically upon clean return</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Catalog + Reservation Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Item Catalog (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Select Equipment to Rent</h2>
              <span className="text-xs text-slate-500">{items.length} items available</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading rental inventory...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const itemImg = item.images?.[0] || "/items/item_camera.svg";

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`cursor-pointer rounded-2xl p-4 transition-all border flex flex-col justify-between ${
                        isSelected
                          ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Item Image */}
                        <div className="aspect-[4/3] rounded-xl bg-slate-100 mb-3 overflow-hidden flex items-center justify-center p-2">
                          <img
                            src={itemImg}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Title & Category */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            In Stock
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                          {item.name}
                        </h3>
                      </div>

                      {/* Pricing Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Daily Rate</div>
                          <div className="text-sm font-black text-slate-900">${item.dailyRate}/day</div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Deposit Hold</div>
                          <div className="text-xs font-bold text-blue-700">${item.depositAmount} hold</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout & PayPal Booking Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Step 1 • Reserve & Hold
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedItem?.name || "Select an Item"}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Category: {selectedItem?.category} • Replacement Value: ${selectedItem?.replacementValue}
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rental Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Pick-up Date</span>
                    <input
                      type="date"
                      min={today}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Return Date</span>
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {!isDurationValid && (
                  <div className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Duration must be between 1 and 25 days (PayPal hold lifespan limit).</span>
                  </div>
                )}
              </div>

              {/* Renter Contact Info */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Renter Information
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={renterName}
                    onChange={(e) => setRenterName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={renterEmail}
                    onChange={(e) => setRenterEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Calculation & Pricing Table */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Rental Fee ({rentalDays} day{rentalDays > 1 ? "s" : ""} × ${selectedItem?.dailyRate})
                  </span>
                  <span className="font-semibold text-slate-900">${rentalFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    Security Deposit Hold (refundable)
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-semibold text-blue-700">${depositAmount.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total PayPal Authorization</span>
                  <span className="text-blue-900 font-black">${totalHoldAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* PayPal Payment Component */}
              {selectedItem && isDurationValid ? (
                <PayPalButtonV6
                  itemId={selectedItem.id}
                  startDate={startDate}
                  endDate={endDate}
                  renterName={renterName}
                  renterEmail={renterEmail}
                  totalHoldAmount={totalHoldAmount}
                  rentalFee={rentalFee}
                  depositAmount={depositAmount}
                  onSuccess={handleBookingSuccess}
                  onError={(err) => setErrorMessage(err)}
                />
              ) : (
                <div className="text-xs text-slate-400 text-center py-2">
                  Select valid dates to initialize PayPal hold.
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

