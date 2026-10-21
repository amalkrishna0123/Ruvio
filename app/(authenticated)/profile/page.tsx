"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  KeyRound,
  Lock,
  LogOut,
  Settings,
  Edit3,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { Avatar, BottomNavigation, PrimaryButton } from "@/components/common";

export default function ProfilePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || "");

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(currentUser.userNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    if (confirm("Disconnect and purge local decrypted session cache?")) {
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F5F2]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-4">
        <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
          My Identity
        </h1>
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6C716D] hover:bg-[#F0F1EE] transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </Link>
      </header>

      {/* Main Profile Info */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Identity Card */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white p-5 shadow-2xs text-center flex flex-col items-center">
          <div className="relative mb-3">
            <Avatar name={name} size="xl" status="online" />
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1F5C4A] text-white shadow-xs hover:bg-[#164638]"
              title="Edit identity"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>

          {isEditing ? (
            <div className="w-full space-y-2 mt-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#E3E5E1] px-3 text-center text-sm font-semibold focus:outline-none focus:border-[#1F5C4A]"
              />
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-8 w-full rounded-lg border border-[#E3E5E1] px-3 text-center text-xs text-[#6C716D] focus:outline-none focus:border-[#1F5C4A]"
              />
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-[#1F5C4A] px-4 py-1 text-xs font-semibold text-white"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold text-[#181A19]">{name}</h2>
              <p className="mt-0.5 text-xs text-[#6C716D]">{bio}</p>
            </>
          )}

          {/* User Number Badge */}
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-[#F0F1EE] px-3.5 py-1.5 border border-[#E3E5E1]">
            <span className="text-xs font-mono font-bold tracking-wider text-[#181A19]">
              #{currentUser.userNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyNumber}
              className="text-[#6C716D] hover:text-[#181A19] transition-colors"
              title="Copy User Number"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#2F7D5B]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[#9B9E9C]">
            Share your 6-digit number to receive encrypted invitations
          </p>
        </div>

        {/* Security / Cryptographic Status */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#181A19]">
            <Shield className="h-4 w-4 text-[#1F5C4A]" />
            <span>Cryptographic State</span>
          </div>

          <div className="divide-y divide-[#E3E5E1]/60 text-xs text-[#6C716D]">
            <div className="flex items-center justify-between py-2">
              <span>Fingerprint</span>
              <span className="font-mono text-[11px] text-[#181A19]">
                4F9B · 82A1 · 31E4
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Session Key Rotation</span>
              <span className="text-[#2F7D5B] font-medium">Automatic (24h)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Relay Verification</span>
              <span className="text-[#181A19] font-medium">Zurich Secure Enclave</span>
            </div>
          </div>
        </div>

        {/* Quick Settings links */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white divide-y divide-[#E3E5E1]/60 shadow-2xs">
          <Link
            href="/settings"
            className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] text-xs font-medium text-[#181A19]"
          >
            <span>Privacy & Ephemeral Storage</span>
            <ChevronRight className="h-4 w-4 text-[#9B9E9C]" />
          </Link>
          <Link
            href="/connections"
            className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] text-xs font-medium text-[#181A19]"
          >
            <span>Verified Connections ({currentUser.name})</span>
            <ChevronRight className="h-4 w-4 text-[#9B9E9C]" />
          </Link>
        </div>

        {/* Logout Action */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-rose-200 p-3 text-xs font-semibold text-[#B94A48] hover:bg-[#FBEAEA] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Purge Session & Log Out</span>
        </button>
      </main>

      <BottomNavigation />
    </div>
  );
}
