"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Radio,
  Search,
  Users,
  Shield,
  Clock,
  Compass,
} from "lucide-react";
import { sampleUsers } from "@/lib/mock-data";
import { Avatar, PrimaryButton, SecondaryButton } from "@/components/common";

export default function LocationPage() {
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Encrypted Location
          </h1>
        </div>

        <Link
          href="/location/loc_node_zurich"
          className="text-xs font-semibold text-[#1F5C4A] hover:underline px-2 py-1"
        >
          View Route
        </Link>
      </header>

      {/* Styled Neutral Map Canvas */}
      <div className="relative flex-1 bg-[#EEF0EB] overflow-hidden select-none">
        {/* Subtle grid pattern for map canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD2C7_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

        {/* Road / Boundary simulation lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <path
            d="M -20,120 Q 150,220 280,180 T 500,260"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <path
            d="M 60,-20 Q 90,160 220,320 T 380,600"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
          />
          <path
            d="M -10,380 L 450,340"
            fill="none"
            stroke="#CBD2C7"
            strokeWidth="4"
          />
        </svg>

        {/* Current user beacon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {isLiveSharing && (
              <span className="absolute h-14 w-14 rounded-full bg-[#1F5C4A]/25 animate-ping" />
            )}
            <div className="h-9 w-9 rounded-full bg-[#1F5C4A] text-white flex items-center justify-center shadow-lg border-2 border-white">
              <Compass className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="mt-1 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#181A19] shadow-xs border border-[#E3E5E1]">
            You · Precision ±4m
          </span>
        </div>

        {/* Nearby Contact marker */}
        <div className="absolute top-1/3 right-1/4 flex flex-col items-center">
          <Link
            href="/location/loc_elena"
            className="flex flex-col items-center hover:scale-105 transition-transform"
          >
            <Avatar name="Elena Rostova" size="sm" className="ring-2 ring-white shadow-md" />
            <span className="mt-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-[#181A19] shadow-xs border border-[#E3E5E1]">
              Elena (1.2 km)
            </span>
          </Link>
        </div>

        {/* Search Bar overlay */}
        <div className="absolute top-3 inset-x-3 z-10">
          <div className="relative flex items-center shadow-md rounded-xl">
            <Search className="absolute left-3.5 h-4 w-4 text-[#6C716D]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search secure landmarks or nodes..."
              className="h-11 w-full rounded-xl bg-white/95 backdrop-blur-md pl-9.5 pr-4 text-xs text-[#181A19] placeholder-[#9B9E9C] border border-[#E3E5E1] focus:outline-none focus:ring-1 focus:ring-[#1F5C4A]"
            />
          </div>
        </div>

        {/* Re-center button */}
        <button
          type="button"
          onClick={() => alert("Centered on current location")}
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#181A19] shadow-md border border-[#E3E5E1] hover:bg-[#F0F1EE]"
          aria-label="Re-center map"
        >
          <Navigation className="h-4.5 w-4.5 text-[#1F5C4A]" />
        </button>
      </div>

      {/* Bottom Sheet Controls */}
      <div className="z-10 bg-white border-t border-[#E3E5E1] p-4 safe-bottom space-y-3">
        {isLiveSharing ? (
          <div className="flex items-center justify-between rounded-xl bg-[#E8F2EE] p-3 border border-[#1F5C4A]/20">
            <div className="flex items-center gap-2.5">
              <Radio className="h-4 w-4 text-[#1F5C4A] animate-pulse" />
              <div>
                <div className="text-xs font-semibold text-[#1F5C4A]">
                  Live Location Sharing Active
                </div>
                <div className="text-[10px] text-[#6C716D]">
                  Updating coordinates via zero-knowledge relay
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLiveSharing(false)}
              className="rounded-lg bg-[#B94A48] px-3 py-1 text-xs font-semibold text-white hover:bg-[#9E3B3A]"
            >
              Stop Sharing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton
              onClick={() => alert("Current static location beacon generated")}
              size="sm"
              icon={<MapPin className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Share Static Pin
            </PrimaryButton>
            <SecondaryButton
              onClick={() => setIsLiveSharing(true)}
              size="sm"
              icon={<Radio className="h-3.5 w-3.5" />}
              className="text-xs font-semibold"
            >
              Start Live Location
            </SecondaryButton>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6C716D]">
          <Shield className="h-3 w-3 text-[#1F5C4A]" />
          <span>No external map trackers or telemetry</span>
        </div>
      </div>
    </div>
  );
}
