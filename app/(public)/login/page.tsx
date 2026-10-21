"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/common";

export default function LoginPage() {
  const router = useRouter();
  const [userNumber, setUserNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex min-h-dvh flex-col justify-between p-6 bg-white safe-top safe-bottom">
      <div>
        <div className="flex items-center -ml-2 mb-8">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back to landing"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
          Authenticate Account
        </h1>
        <p className="mt-1 text-xs text-[#6C716D]">
          Enter your assigned identifier to initiate cryptographic challenge verification.
        </p>

        <form onSubmit={handleSendOTP} className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="loginUserNumber"
              className="block text-xs font-medium text-[#181A19] mb-1.5"
            >
              Assigned User Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-semibold text-[#9B9E9C]">
                #
              </span>
              <input
                id="loginUserNumber"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={userNumber}
                onChange={(e) => {
                  setUserNumber(e.target.value.replace(/\D/g, ""));
                  if (error) setError("");
                }}
                placeholder="482910"
                className="h-12 w-full rounded-xl bg-[#F0F1EE] pl-8 pr-4 font-mono text-base font-semibold tracking-wider text-[#181A19] placeholder-[#9B9E9C] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A] transition-all"
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-[#B94A48]">{error}</p>}
          </div>

          <PrimaryButton
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full text-sm font-semibold"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Request One-Time Code
          </PrimaryButton>
        </form>
      </div>

      <div className="border-t border-[#E3E5E1] pt-4 flex items-center gap-2 text-xs text-[#6C716D]">
        <ShieldCheck className="h-4 w-4 text-[#1F5C4A] flex-shrink-0" />
        <span>End-to-end encrypted protocol authentication.</span>
      </div>
    </div>
  );
}
