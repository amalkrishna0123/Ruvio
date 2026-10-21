"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { PrimaryButton } from "@/components/common";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userNumber = searchParams.get("number") || "482910";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(54);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorStatus(null);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setErrorStatus("Please enter all 6 verification digits.");
      return;
    }

    // Interactive demo trigger: '000000' shows invalid state for testing
    if (code === "000000") {
      setErrorStatus("Verification code is invalid or has expired.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      router.push("/home");
    }, 500);
  };

  const handleResend = () => {
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
    setErrorStatus(null);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between p-6 bg-white safe-top safe-bottom">
      <div>
        <div className="flex items-center -ml-2 mb-6">
          <Link
            href="/login"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back to login"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
          Enter Security Code
        </h1>
        <p className="mt-1 text-xs text-[#6C716D] leading-relaxed">
          Sent to registered secure relay for user{" "}
          <span className="font-semibold text-[#181A19]">#{userNumber}</span>{" "}
          (m***@s***.io)
        </p>

        <form onSubmit={handleVerify} className="mt-8">
          {/* 6 OTP Inputs */}
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`h-13 w-11 rounded-xl text-center font-mono text-xl font-semibold transition-all border ${
                  digit
                    ? "border-[#1F5C4A] bg-white text-[#181A19]"
                    : "border-[#E3E5E1] bg-[#F0F1EE] text-[#181A19]"
                } focus:border-[#1F5C4A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A]`}
              />
            ))}
          </div>

          {errorStatus ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#B94A48]">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{errorStatus}</span>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-[#9B9E9C]">
              Tip: Paste or enter any 6 digits (e.g. 123456) to proceed.
            </p>
          )}

          <div className="mt-7">
            <PrimaryButton
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm font-semibold"
            >
              Verify & Unlock Session
            </PrimaryButton>
          </div>
        </form>

        {/* Resend Action */}
        <div className="mt-6 flex items-center justify-center text-xs">
          {timer > 0 ? (
            <span className="text-[#6C716D]">
              Resend code in{" "}
              <span className="font-semibold text-[#181A19]">
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-medium text-[#1F5C4A] hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Resend verification code
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-[#E3E5E1] pt-4 text-center">
        <span className="text-[11px] text-[#9B9E9C]">
          Zero biometric or phone number exposure
        </span>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white text-xs text-[#6C716D]">
          Loading authentication gateway...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
