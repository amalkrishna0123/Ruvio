"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UserCheck, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { User } from "@/types";
import { Avatar, PrimaryButton, SecondaryButton } from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";
import { searchGenuineUser, addGenuineConnection } from "@/lib/firebase/connections-service";

export default function ConnectUserPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [userNumber, setUserNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string>("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNumber.trim() || userNumber.length !== 6) {
      setErrorStatus("Please enter a valid 6-digit User Number");
      setFoundUser(null);
      return;
    }

    if (userProfile && userProfile.userNumber === userNumber) {
      setErrorStatus("You cannot connect with your own User Number.");
      setFoundUser(null);
      return;
    }

    setErrorStatus(null);
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const match = await searchGenuineUser(userNumber);
      setIsLoading(false);
      if (match) {
        setFoundUser(match);
      } else {
        setFoundUser(null);
        setErrorStatus(`No user found with identifier #${userNumber}. Verify the number with the recipient.`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setFoundUser(null);
      setErrorStatus(err?.message || "Search failed. Please try again.");
    }
  };

  const handleConnect = async () => {
    if (!userProfile || !foundUser) return;
    try {
      const convId = await addGenuineConnection(userProfile, foundUser);
      setActiveConvId(convId);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorStatus(err?.message || "Failed to establish connection.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Connect New User
          </h1>
        </div>
        <Link
          href="/connections"
          className="text-xs font-medium text-[#1F5C4A] hover:underline px-2 py-1"
        >
          My Connections
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-5 max-w-md mx-auto w-full">
        <p className="text-xs text-[#6C716D] leading-relaxed">
          Connect directly with another individual by entering their anonymous 6-digit identifier.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="mt-5 space-y-3">
          <div>
            <label
              htmlFor="connectNumber"
              className="block text-xs font-medium text-[#181A19] mb-1.5"
            >
              Recipient 6-Digit Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-semibold text-[#9B9E9C]">
                #
              </span>
              <input
                id="connectNumber"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={userNumber}
                onChange={(e) => {
                  setUserNumber(e.target.value.replace(/\D/g, ""));
                  setErrorStatus(null);
                  setFoundUser(null);
                  setIsSuccess(false);
                }}
                placeholder="Enter 6-digit ID"
                className="h-12 w-full rounded-xl bg-[#F0F1EE] pl-8 pr-4 font-mono text-base font-semibold tracking-wider text-[#181A19] placeholder-[#9B9E9C] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A]"
              />
            </div>
          </div>

          <PrimaryButton
            type="submit"
            isLoading={isLoading}
            className="w-full"
            icon={<Search className="w-4 h-4" />}
          >
            Locate User
          </PrimaryButton>
        </form>

        {/* Error message */}
        {errorStatus && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FBEAEA] p-3 text-xs text-[#B94A48] border border-rose-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorStatus}</span>
          </div>
        )}

        {/* Found User Confirmation Card */}
        {foundUser && (
          <div className="mt-6 rounded-2xl border border-[#E3E5E1] bg-[#FAFAF8] p-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <Avatar
                name={foundUser.name}
                userNumber={foundUser.userNumber}
                avatarUrl={foundUser.avatarUrl}
                status={foundUser.status}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-[#181A19] truncate">
                    {foundUser.name}
                  </h3>
                  <span className="rounded bg-[#E8F2EE] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#1F5C4A]">
                    #{foundUser.userNumber}
                  </span>
                </div>
                {foundUser.bio && (
                  <p className="text-xs text-[#6C716D] mt-0.5 truncate">{foundUser.bio}</p>
                )}
                {foundUser.joinedDate && (
                  <p className="text-[11px] text-[#9B9E9C]">Member since {foundUser.joinedDate}</p>
                )}
              </div>
            </div>

            {isSuccess ? (
              <div className="mt-4 pt-3 border-t border-[#E3E5E1] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2F7D5B]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Connection established successfully!</span>
                </div>
                <PrimaryButton
                  onClick={() => router.push(`/chat/${activeConvId || foundUser.id}`)}
                  className="w-full text-xs"
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  Start Private Chat
                </PrimaryButton>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-[#E3E5E1] flex gap-2">
                <PrimaryButton
                  onClick={handleConnect}
                  className="flex-1 text-xs"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                >
                  Add Connection
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => setFoundUser(null)}
                  className="text-xs px-3"
                >
                  Cancel
                </SecondaryButton>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
