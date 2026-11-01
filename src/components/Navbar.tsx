"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Calendar,
  Layers,
  BarChart3,
  Settings,
  Terminal,
  Store,
  ExternalLink,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isOwner = pathname.startsWith("/owner");
  const isStorefront = pathname.startsWith("/b/");
  const isRenter = pathname.startsWith("/r/");

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl tracking-tight font-black bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 bg-clip-text text-transparent">
                Fairhold
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              PayPal v6 • Sandbox
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/b/summit-shutter"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                isStorefront
                  ? "bg-slate-100 text-blue-950 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Store className="w-4 h-4 text-sky-600" />
              Storefront
            </Link>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <Link
              href="/owner"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/owner"
                  ? "bg-blue-50 text-blue-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Operations
            </Link>

            <Link
              href="/owner/schedule"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith("/owner/schedule")
                  ? "bg-blue-50 text-blue-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              Bryntum Schedule
            </Link>

            <Link
              href="/owner/items"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith("/owner/items")
                  ? "bg-blue-50 text-blue-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4 text-slate-500" />
              Inventory
            </Link>

            <Link
              href="/owner/analytics"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith("/owner/analytics")
                  ? "bg-blue-50 text-blue-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              AG Studio
            </Link>

            <Link
              href="/owner/sandbox"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith("/owner/sandbox")
                  ? "bg-blue-50 text-blue-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-600" />
              Sandbox Tools
            </Link>

            <Link
              href="/owner/settings"
              aria-label="Settings"
              className={`p-1.5 rounded-lg transition-colors ${
                pathname.startsWith("/owner/settings")
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </nav>

          {/* Quick Demo Switcher */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/owner"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-900 text-white hover:bg-blue-950 transition-colors shadow-sm"
            >
              Owner Portal
            </Link>
            <Link
              href="/b/summit-shutter"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              Renter View
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
