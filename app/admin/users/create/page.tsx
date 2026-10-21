"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, CheckCircle2 } from "lucide-react";
import { PrimaryButton } from "@/components/common";

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"online" | "away" | "offline">("online");
  const [autoNumber] = useState(
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please complete user name and email fields.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/admin/users");
    }, 450);
  };

  return (
    <div className="space-y-5 max-w-xl">
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/users"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-white active:scale-95 transition-colors border border-transparent hover:border-[#E3E5E1]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181A19]">
            Provision New User Account
          </h1>
          <p className="text-xs text-[#6C716D]">
            Issue cryptographic keys and unique 6-digit identifier
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-[#E3E5E1] bg-white p-6 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Number preview banner */}
          <div className="flex items-center justify-between rounded-xl bg-[#E8F2EE] p-3.5 border border-[#1F5C4A]/20">
            <div>
              <div className="text-xs font-semibold text-[#1F5C4A]">
                Assigned 6-Digit Identifier
              </div>
              <div className="text-[11px] text-[#6C716D]">
                Cryptographically derived unique node tag
              </div>
            </div>
            <div className="font-mono text-base font-bold text-[#1F5C4A]">
              #{autoNumber}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#181A19] mb-1">
              Full Name <span className="text-[#B94A48]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Dr. Henrik Lindqvist"
              className="h-10 w-full rounded-xl bg-[#F0F1EE] px-3.5 text-xs text-[#181A19] focus:bg-white focus:outline-none focus:border-[#1F5C4A] border border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#181A19] mb-1">
              Contact / Relay Email <span className="text-[#B94A48]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="h.lindqvist@research.se"
              className="h-10 w-full rounded-xl bg-[#F0F1EE] px-3.5 text-xs text-[#181A19] focus:bg-white focus:outline-none focus:border-[#1F5C4A] border border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#181A19] mb-1">
              Initial Provisioning Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-10 w-full rounded-xl bg-[#F0F1EE] px-3 text-xs text-[#181A19] focus:bg-white focus:outline-none focus:border-[#1F5C4A] border border-transparent"
            >
              <option value="online">Active & Online</option>
              <option value="away">Standby / Away</option>
              <option value="offline">Offline Enclave</option>
            </select>
          </div>

          {error && <p className="text-xs text-[#B94A48]">{error}</p>}

          <div className="pt-2">
            <PrimaryButton
              type="submit"
              isLoading={isLoading}
              className="w-full text-xs"
              icon={<UserPlus className="h-4 w-4" />}
            >
              Issue Account & Keys
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
