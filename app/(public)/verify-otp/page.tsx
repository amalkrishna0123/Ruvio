"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Sparkles } from "lucide-react";
import { PrimaryButton } from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userNumber = searchParams.get("number") || "";
  const maskedEmail = searchParams.get("maskedEmail") || "";
  const urlOtp = searchParams.get("otp") || "";
  const { verifyOtpAndLogin, sendOtp } = useAuth();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(54);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeOtp, setActiveOtp] = useState<string>("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("ruvio_pending_otp_" + userNumber) ||
          sessionStorage.getItem("ruvio_last_otp")
        : "";
    const resolved = urlOtp || stored || "";
    if (resolved) {
      setActiveOtp(resolved);
    }
  }, [urlOtp, userNumber]);

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

  const handleAutoFill = () => {
    if (!activeOtp) return;
    const digits = activeOtp.split("").slice(0, 6);
    setOtp(digits);
    setErrorStatus(null);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setErrorStatus("Please enter all 6 verification digits.");
      return;
    }

    setIsLoading(true);
    setErrorStatus(null);
    try {
      await verifyOtpAndLogin(userNumber, code);
      router.push("/home");
    } catch (err: any) {
      setIsLoading(false);
      setErrorStatus(err?.message || "Verification code is invalid or has expired.");
    }
  };

  const handleResend = async () => {
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
    setErrorStatus(null);
    inputRefs.current[0]?.focus();
    try {
      const res = await sendOtp(userNumber);
      if (res.otpCode) {
        setActiveOtp(res.otpCode);
      }
    } catch (err: any) {
      setErrorStatus(err?.message || "Failed to resend verification code.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between p-6 bg-white safe-top safe-bottom">
      <div>
        <div className="flex items-center -ml-2 mb-6">
          <Link
            href="/"
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
          {maskedEmail ? `(${maskedEmail})` : ""}
        </p>

        {/* ── Active Verification Code Card (Ensures OTP is clearly shared) ── */}
        {activeOtp && (
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#E8F2EE] border border-[#1F5C4A]/30 p-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1F5C4A]">
                <KeyRound className="h-3.5 w-3.5" />
                Security Verification Code
              </div>
              <div className="font-mono text-2xl font-bold tracking-[0.25em] text-[#1F5C4A]">
                {activeOtp}
              </div>
              <div className="text-[11px] text-[#55786D]">
                Assigned to your registered session
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#18493a] active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto-fill
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-7">
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
              {activeOtp
                ? `Tip: Enter code ${activeOtp} or click Auto-fill above.`
                : "Tip: Enter the 6-digit code shared for your user identifier (or 123456 for testing)."}
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
              className="inline-flex items-center gap-1.5 font-medium text-[#1F5C4A] hover:underline cursor-pointer"
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
