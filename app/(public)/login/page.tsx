"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [userNumber, setUserNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNumber, setShowNumber] = useState(false);

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNumber.trim()) {
      setError("Please enter your 6-digit User Number");
      return;
    }
    if (userNumber.length !== 6 || !/^\d+$/.test(userNumber)) {
      setError("User Number must be exactly 6 digits");
      return;
    }
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/verify-otp?number=${userNumber}`);
    }, 450);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0C0C0E]">

      {/* Full-page gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(160deg, #d400ffff, #280030ff 100%)",
        }}
      />

      {/* Radial bloom top-left */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30 z-0 pointer-events-none"
        
      />
      {/* Radial bloom bottom-right */}
      <div
        className="absolute bottom-[5%] right-[-15%] w-[60%] h-[60%] rounded-full opacity-20 z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, #190031ff 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pt-16 pb-8">

        {/* ── Logo + Brand ── */}
        <div className="flex flex-col items-center gap-5">
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

          <div className="text-center">
            <h1 className="text-[30px] font-medium text-white leading-tight tracking-tight">
              Welcome to Ruvio
            </h1>
            <p className="mt-1.5 text-[14px] text-white/60 font-medium">
              Sign in to continue to Ruvio
            </p>
          </div>
        </div>

        {/* ── Glass form card ── */}
        <div
          className="w-full max-w-sm mx-auto rounded-3xl p-6 mt-10"
          style={{
            background: "rgba(255, 255, 255, 1)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <form onSubmit={handleSendOTP} className="space-y-4">

            {/* Label + Input */}
            <div>
              <label
                htmlFor="loginUserNumber"
                className="block text-[11px] font-semibold text-black uppercase tracking-[0.12em] mb-2.5"
              >
                User Number
              </label>

              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-bold text-black/40 select-none">#</span>
                <input
                  id="loginUserNumber"
                  type={showNumber ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={6}
                  value={userNumber}
                  onChange={(e) => {
                    setUserNumber(e.target.value.replace(/\D/g, ""));
                    if (error) setError("");
                  }}
                  placeholder="482910"
                  className="h-[54px] w-full rounded-2xl pl-9 pr-12 font-mono text-[18px] font-semibold tracking-[0.25em] text-black placeholder-black/25 focus:outline-none transition-all"
                  style={{
                    background: "",
                    border: error
                      ? "1px solid rgba(239,68,68,0.6)"
                      : "1px solid rgba(184, 184, 184, 0.75)",
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

              {error && (
                <p className="mt-2 text-[12px] text-red-400/90 font-medium flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              id="loginSubmitBtn"
              type="submit"
              disabled={isLoading}
              className="w-full h-[54px] rounded-2xl font-semibold text-[15px] text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              style={{
                background: isLoading
                  ? "rgba(0, 0, 0, 1)"
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
                  Sending code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send One-Time Code
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
            End-to-end encrypted · Zero metadata
          </span>
        </div>

      </div>
    </div>
  );
}
