"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Lock, KeyRound } from "lucide-react";
import { PrimaryButton } from "@/components/common";

export default function LandingPage() {
  const router = useRouter();
  const [userNumber, setUserNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex min-h-dvh flex-col justify-between p-6 bg-white safe-top safe-bottom">
      {/* Top minimal brand mark */}
      <div className="pt-8">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F5C4A] text-white shadow-xs">
          <Shield className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-[#1F5C4A]">
          SignalCore Network
        </div>
      </div>

      {/* Main Content */}
      <div className="my-auto py-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#181A19]">
          Private communication, <br />
          zero compromise.
        </h1>
        <p className="mt-2 text-sm text-[#6C716D] leading-relaxed">
          Peer-to-peer encrypted messaging, secure project coordination, and blind relay audio.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="userNumber"
              className="block text-xs font-medium text-[#181A19] mb-1.5"
            >
              Your 6-Digit User Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-semibold text-[#9B9E9C]">
                #
              </span>
              <input
                id="userNumber"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={userNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setUserNumber(val);
                  if (error) setError("");
                }}
                placeholder="482910"
                className="h-12 w-full rounded-xl bg-[#F0F1EE] pl-8 pr-4 font-mono text-base font-semibold tracking-wider text-[#181A19] placeholder-[#9B9E9C] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A] transition-all"
              />
            </div>
            {error ? (
              <p className="mt-1.5 text-xs text-[#B94A48]">{error}</p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[#9B9E9C]">
                Demo numbers: 482910, 731940, 518392
              </p>
            )}
          </div>

          <PrimaryButton
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full text-sm font-semibold"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to Verification
          </PrimaryButton>
        </form>
      </div>

      {/* Security note footer */}
      <div className="border-t border-[#E3E5E1] pt-4">
        <div className="flex items-center gap-2 text-xs text-[#6C716D]">
          <Lock className="h-3.5 w-3.5 text-[#1F5C4A] flex-shrink-0" />
          <span>No phone numbers or personal identifiers required.</span>
        </div>
      </div>
    </div>
  );
}
