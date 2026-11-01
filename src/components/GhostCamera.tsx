"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Upload,
  Check,
  Zap,
} from "lucide-react";

interface GhostCameraProps {
  shotKey: string;
  shotLabel: string;
  shotInstructions: string;
  baselinePhotoUrl?: string; // If return inspection, baseline photo for ghost overlay
  onPhotoCaptured: (data: { fileUrl: string; sha256Hash: string; width: number; height: number }) => void;
  demoPhotos?: Array<{ label: string; url: string; description: string }>;
}

export default function GhostCamera({
  shotKey,
  shotLabel,
  shotInstructions,
  baselinePhotoUrl,
  onPhotoCaptured,
  demoPhotos = [],
}: GhostCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [ghostOpacity, setGhostOpacity] = useState(0.45);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isAnalyzingQa, setIsAnalyzingQa] = useState(false);
  const [qaFeedback, setQaFeedback] = useState<{
    passed: boolean;
    blurScore: number;
    feedback: string;
    retakeTips?: string[];
  } | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.warn("Camera access not available or denied:", err);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Run AI QA Check
  const runQaCheck = async (photoUrl: string) => {
    setIsAnalyzingQa(true);
    try {
      const res = await fetch("/api/inspections/photo-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl,
          shotKey,
          expectedAngle: shotLabel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQaFeedback(data);
      }
    } catch (e) {
      console.warn("QA check failed:", e);
    } finally {
      setIsAnalyzingQa(false);
    }
  };

  // Capture from live video
  const handleCaptureVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhotoUrl(dataUrl);
    runQaCheck(dataUrl);

    onPhotoCaptured({
      fileUrl: dataUrl,
      sha256Hash: "hash_" + Math.random().toString(36).substring(2, 10),
      width: canvas.width,
      height: canvas.height,
    });
  };

  // Select demo photo (for judges fast-track)
  const handleSelectDemoPhoto = (url: string) => {
    setCapturedPhotoUrl(url);
    runQaCheck(url);
    onPhotoCaptured({
      fileUrl: url,
      sha256Hash: "hash_" + Math.random().toString(36).substring(2, 10),
      width: 1200,
      height: 800,
    });
  };

  // Handle file input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedPhotoUrl(result);
      runQaCheck(result);
      onPhotoCaptured({
        fileUrl: result,
        sha256Hash: "hash_" + Math.random().toString(36).substring(2, 10),
        width: 1200,
        height: 800,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col">
      {/* Top Banner / Shot Instructions */}
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-sky-400">
            Inspection Angle
          </span>
          <h4 className="text-base font-bold text-white">{shotLabel}</h4>
          <p className="text-xs text-slate-300 mt-0.5">{shotInstructions}</p>
        </div>

        {baselinePhotoUrl && (
          <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs text-slate-300">Ghost:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ghostOpacity}
              onChange={(e) => setGhostOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 accent-sky-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 w-6 text-right">
              {Math.round(ghostOpacity * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Viewfinder Area */}
      <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
        {capturedPhotoUrl ? (
          <img
            src={capturedPhotoUrl}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Live Camera Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Ghost Baseline Overlay for Return Inspection */}
            {baselinePhotoUrl && (
              <img
                src={baselinePhotoUrl}
                alt="Baseline Ghost Overlay"
                style={{ opacity: ghostOpacity }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none filter contrast-125 saturate-150"
              />
            )}

            {/* Alignment Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Target Reticle */}
            <div className="absolute w-24 h-24 border-2 border-dashed border-sky-400/60 rounded-xl pointer-events-none animate-pulse-subtle flex items-center justify-center">
              <div className="w-2 h-2 bg-sky-400 rounded-full" />
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* AI Photo Quality Assessment Bar */}
      {isAnalyzingQa && (
        <div className="bg-blue-950/80 px-4 py-2 flex items-center gap-2 border-t border-blue-800 text-xs text-blue-200">
          <span className="w-3.5 h-3.5 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
          <span>AI Vision evaluating focus, lighting, and framing...</span>
        </div>
      )}

      {qaFeedback && !isAnalyzingQa && (
        <div
          className={`px-4 py-2 border-t text-xs flex items-center justify-between ${
            qaFeedback.passed
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
              : "bg-amber-950/70 border-amber-800 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {qaFeedback.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span>{qaFeedback.feedback}</span>
          </div>

          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
            Sharpness: {Math.round(qaFeedback.blurScore * 100)}%
          </span>
        </div>
      )}

      {/* Control Actions */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {capturedPhotoUrl ? (
            <button
              type="button"
              onClick={() => {
                setCapturedPhotoUrl(null);
                setQaFeedback(null);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Shot
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCaptureVideo}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
                Capture Angle
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Upload Photo File"
              >
                <Upload className="w-5 h-5" />
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Judge Fast-Track Demo Photos */}
        {demoPhotos.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Judge Fast-Track: Load Demo Scenario</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoPhotos.map((dp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDemoPhoto(dp.url)}
                  className="px-2.5 py-1.5 rounded-lg text-left bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition-all text-xs group"
                >
                  <div className="font-semibold text-sky-300 group-hover:text-sky-200">
                    {dp.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {dp.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
