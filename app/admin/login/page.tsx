"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/common";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@signalcore.internal");
  const [password, setPassword] = useState("••••••••••••");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please provide administrator credentials");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      router.push("/admin");
    }, 450);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-[#F5F5F2]">
      <div className="w-full max-w-sm rounded-2xl border border-[#E3E5E1] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5C4A] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#181A19]">
              Admin Gateway
            </h1>
            <p className="text-xs text-[#6C716D]">
              SignalCore Node Controller
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#181A19] mb-1">
              Admin Email / Identifier
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl bg-[#F0F1EE] px-3 text-xs text-[#181A19] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#181A19] mb-1">
              Cryptographic Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl bg-[#F0F1EE] px-3 text-xs text-[#181A19] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#B94A48]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}

          <PrimaryButton
            type="submit"
            isLoading={isLoading}
            className="w-full text-xs"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Authenticate Controller
          </PrimaryButton>
        </form>

        <div className="mt-6 border-t border-[#E3E5E1] pt-3 text-center">
          <Link
            href="/login"
            className="text-xs text-[#1F5C4A] hover:underline"
          >
            Switch to User Mobile Application
          </Link>
        </div>
      </div>
    </div>
  );
}
