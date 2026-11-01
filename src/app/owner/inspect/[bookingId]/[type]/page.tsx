"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import GhostCamera from "@/components/GhostCamera";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

interface CapturedShot {
  shotKey: string;
  fileUrl: string;
  sha256Hash: string;
  width: number;
  height: number;
}

export default function OwnerInspectPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const inspectionType = ((params.type as string) || "checkout").toUpperCase(); // "CHECKOUT" or "RETURN"

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [capturedShots, setCapturedShots] = useState<CapturedShot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch (err) {
        console.error("Failed to load booking:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
          Loading inspection checklist...
        </div>
      </div>
    );
  }

  const shotList = typeof booking.item?.shotList === "string"
    ? JSON.parse(booking.item.shotList)
    : booking.item?.shotList || [
        { key: "shot_front_mount", label: "Front Mount & Sensor Glass", instructions: "Direct head-on view of the lens mount flange and sensor cavity." },
        { key: "shot_rear_lcd", label: "Rear LCD Screen & Dials", instructions: "Inspect articulated display and viewfinder eyecup." },
        { key: "shot_top_dials", label: "Top Controls & Hot Shoe", instructions: "Bird's-eye view of mode dials and multi-interface hot shoe." },
        { key: "shot_base_mount", label: "Tripod Base & Battery Door", instructions: "Inspect 1/4-20 mounting thread and battery latch." },
      ];

  const currentShot = shotList[currentShotIndex] || shotList[0];

  // Baseline photos if return inspection
  const checkoutInsp = booking.inspections?.find((i: any) => i.type === "CHECKOUT");
  const matchingBaselinePhoto = checkoutInsp?.photos?.find(
    (p: any) => p.shotKey === currentShot.key
  );

  // Judge fast-track demo photos for this shot
  const demoPhotos = [
    {
      label: "Act 1: Pristine Clean",
      url: "/demo-photos/sony-a7iv/shot_front_mount.svg",
      description: "No damage. 100% deposit released.",
    },
    {
      label: "Act 2: Gouge Damage ($175)",
      url: "/demo-photos/sony-a7iv/shot_front_mount_damaged.svg",
      description: "Severe scratches into bayonet metal.",
    },
    {
      label: "Act 3: Dust/Fingerprints ($0)",
      url: "/demo-photos/sony-a7iv/shot_front_mount_dusty.svg",
      description: "Covered by wear-and-tear policy.",
    },
    {
      label: "Baseline: Pre-Existing Mark",
      url: "/demo-photos/sony-a7iv/shot_front_mount_preexisting.svg",
      description: "Recorded at checkout. Non-chargeable.",
    },
  ];

  const handlePhotoCaptured = (photoData: {
    fileUrl: string;
    sha256Hash: string;
    width: number;
    height: number;
  }) => {
    const updated = [...capturedShots];
    const existingIndex = updated.findIndex((s) => s.shotKey === currentShot.key);
    const newEntry: CapturedShot = {
      shotKey: currentShot.key,
      ...photoData,
    };

    if (existingIndex >= 0) {
      updated[existingIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }
    setCapturedShots(updated);
  };

  const handleFinishInspection = async () => {
    setIsSubmitting(true);
    try {
      const endpoint =
        inspectionType === "RETURN"
          ? "/api/inspections/return"
          : "/api/inspections/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          photos: capturedShots.length > 0 ? capturedShots : [
            {
              shotKey: currentShot.key,
              fileUrl: demoPhotos[0].url,
              sha256Hash: "hash_demo_act1",
              width: 1200,
              height: 800,
            },
          ],
        }),
      });

      if (res.ok) {
        router.push(`/owner/bookings/${booking.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Inspection submission failed");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-bold text-sky-400">
              <span>{inspectionType} Inspection</span>
              <span>•</span>
              <span>Angle {currentShotIndex + 1} of {shotList.length}</span>
            </div>
            <h2 className="text-lg font-black text-white">{booking.item?.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Captured: {capturedShots.length}/{shotList.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Inspection Viewport */}
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1 flex flex-col justify-center">
        {/* Shot Navigation Checklist */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {shotList.map((s: any, idx: number) => {
            const isDone = capturedShots.some((cs) => cs.shotKey === s.key);
            const isCurrent = idx === currentShotIndex;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setCurrentShotIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isCurrent
                    ? "bg-sky-500 text-slate-950 ring-2 ring-sky-300"
                    : isDone
                    ? "bg-emerald-950 border border-emerald-600 text-emerald-300"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{idx + 1}.</span>}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ghost Camera Component */}
        <GhostCamera
          key={currentShot.key}
          shotKey={currentShot.key}
          shotLabel={currentShot.label}
          shotInstructions={currentShot.instructions}
          baselinePhotoUrl={matchingBaselinePhoto?.fileUrl}
          onPhotoCaptured={handlePhotoCaptured}
          demoPhotos={demoPhotos}
        />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            disabled={currentShotIndex === 0}
            onClick={() => setCurrentShotIndex(Math.max(0, currentShotIndex - 1))}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
          >
            Previous Angle
          </button>

          {currentShotIndex < shotList.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentShotIndex(currentShotIndex + 1)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-md"
            >
              <span>Next Angle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishInspection}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Running Forensic Analysis...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Complete {inspectionType === "RETURN" ? "Comparison & Settlement" : "Baseline"}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
