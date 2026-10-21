"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [userNumber, setUserNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNumber, setShowNumber] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNumber.trim()) {
      setError("Please enter your 6-digit User Number");
      return;
    }
    if (userNumber.length !== 6 || !/^\d+$/.test(userNumber)) {
      setError("User Number must be exactly 6 digits (e.g. 482910)");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/verify-otp?number=${userNumber}`);
    }, 400);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0C0C0E]">

      {/* ── Full-page gradient (identical to login) ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(160deg, #d400ffff, #280030ff 100%)",
        }}
      />

      {/* Radial bloom – top-left */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30 z-0 pointer-events-none"

      />
      {/* Radial bloom – bottom-right */}
      <div
        className="absolute bottom-[5%] right-[-15%] w-[60%] h-[60%] rounded-full opacity-20 z-0 pointer-events-none"
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pt-16 pb-8">

        {/* ── Logo + Hero copy ── */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Logo card */}
          <div
            className="flex h-[90px] w-[90px] items-center justify-center rounded-[26px] overflow-hidden shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.20)",
            }}
          >
            <Image
              src="/images/ruvio-logo.png"
              alt="Ruvio"
              width={60}
              height={60}
              className="object-contain invert"
              priority
            />
          </div>

          {/* Brand name */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-2">
              Ruvio Network
            </p>
            <h1 className="text-[30px] font-medium text-white leading-tight tracking-tight">
              Private communication,<br />zero compromise.
            </h1>
            <p className="mt-3 text-[14px] text-white/55 leading-relaxed max-w-xs mx-auto">
              Peer-to-peer encrypted messaging, secure project coordination, and blind relay audio.
            </p>
          </div>
        </div>

        {/* ── Glass form card ── */}
        <div
          className="w-full max-w-sm mx-auto rounded-3xl p-6 mt-10"
          style={{
            background: "#fff",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Label + Input */}
            <div>
              <label
                htmlFor="userNumber"
                className="block text-[11px] font-semibold text-black uppercase tracking-[0.12em] mb-2.5"
              >
                Your 6-Digit User Number
              </label>

              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-bold text-black/40 select-none">#</span>
                <input
                  id="userNumber"
                  type={showNumber ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={6}
                  value={userNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setUserNumber(val);
                    if (error) setError("");
                  }}
                  placeholder="482910"
                  className="h-[54px] border-1 w-full border border-[#e7e7e7] rounded-2xl pl-9 pr-12 font-mono text-[18px] font-semibold tracking-[0.25em] text-black placeholder-black/25 focus:outline-none transition-all"
                  style={{
                    background: "",
                    border: error
                      ? "1px solid rgba(239,68,68,0.6)"
                      : "1px solid rgba(187, 187, 187, 0.79)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNumber(!showNumber)}
                  className="absolute right-4 text-black/40 hover:text-black/70 transition-colors cursor-pointer"
                  aria-label="Toggle visibility"
                >
                  {showNumber
                    ? <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                    : <Eye className="h-4 w-4" strokeWidth={1.8} />
                  }
                </button>
              </div>

              {/* Error or hint */}
              {error ? (
                <p className="mt-2 text-[12px] text-red-400/90 font-medium flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-black flex items-center gap-1.5">
                  <Lock className="h-3 w-3 flex-shrink-0" strokeWidth={1.8} />
                  Demo: 482910 · 731940 · 518392
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              id="landingSubmitBtn"
              type="submit"
              disabled={isLoading}
              className="w-full h-[54px] rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              style={{
                background: isLoading
                  ? "rgba(255,255,255,0.15)"
                  : "linear-gradient(135deg, #000000ff 0%, #000000ff 100%)",
                boxShadow: "0 4px 28px rgba(107, 124, 184, 0.09)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue to Verification
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* ── Bottom security badge ── */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <ShieldCheck className="h-4 w-4 text-white/35 flex-shrink-0" strokeWidth={1.8} />
          <span className="text-[12px] text-white/35 font-medium">
            No phone numbers or personal identifiers required.
          </span>
        </div>

      </div>
    </div>
  );
}
