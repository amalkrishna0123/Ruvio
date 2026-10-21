"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Navigation,
  Share2,
  MapPin,
  Clock,
  Compass,
  ExternalLink,
} from "lucide-react";
import { sampleUsers } from "@/lib/mock-data";
import { Avatar, PrimaryButton, SecondaryButton } from "@/components/common";

export default function LocationDetailsPage() {
  const params = useParams();
  const locationId = (params?.locationId as string) || "loc_node_zurich";

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/location"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Route Navigation
          </h1>
        </div>

        <button
          type="button"
          onClick={() => alert("Route link copied to encrypted clipboard")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6C716D] hover:bg-[#F0F1EE] transition-colors"
          aria-label="Share route"
        >
          <Share2 className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* Styled Route Map View */}
      <div className="relative flex-1 bg-[#EEF0EB] overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(#CBD2C7_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />

        {/* Route Line SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d="M 90,420 C 140,320 180,240 320,130"
            fill="none"
            stroke="#1F5C4A"
            strokeWidth="5"
            strokeDasharray="6 4"
          />
        </svg>

        {/* Origin Marker (You) */}
        <div className="absolute bottom-24 left-16 flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-[#1F5C4A] text-white flex items-center justify-center border-2 border-white shadow-md">
            <Compass className="h-4 w-4" />
          </div>
          <span className="mt-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#181A19] shadow-xs border border-[#E3E5E1]">
            Origin
          </span>
        </div>

        {/* Destination Marker */}
        <div className="absolute top-24 right-16 flex flex-col items-center">
          <div className="h-9 w-9 rounded-full bg-[#B94A48] text-white flex items-center justify-center border-2 border-white shadow-md animate-bounce">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="mt-1 rounded bg-white px-2 py-0.5 text-[11px] font-bold text-[#181A19] shadow-xs border border-[#E3E5E1]">
            Zurich Vault Node #2
          </span>
        </div>
      </div>

      {/* Route Details Card */}
      <div className="bg-white border-t border-[#E3E5E1] p-4 safe-bottom space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#181A19]">
              Zurich Vault Node #2
            </h2>
            <p className="text-xs text-[#6C716D]">
              Hardened physical data relay facility
            </p>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-[#1F5C4A]">14 min</div>
            <div className="text-xs text-[#6C716D]">4.2 km via West Ring</div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[#E3E5E1]/60 pt-3 text-xs text-[#6C716D]">
          <Avatar name="Elena Rostova" size="sm" />
          <div>
            <span className="font-semibold text-[#181A19]">Shared by Elena Rostova</span>
            <span className="block text-[11px] text-[#9B9E9C]">Expires in 42 minutes</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <PrimaryButton
            onClick={() => alert("Initiating turn-by-turn navigation overlay")}
            icon={<Navigation className="h-4 w-4" />}
          >
            Start Route
          </PrimaryButton>
          <SecondaryButton
            onClick={() => alert("Copied coordinate beacon")}
            icon={<ExternalLink className="h-4 w-4" />}
          >
            Copy Coordinates
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
