"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Bell,
  SunMoon,
  Phone,
  MapPin,
  HardDrive,
  Info,
  AlertTriangle,
  ChevronRight,
  Check,
} from "lucide-react";
import { BottomNavigation } from "@/components/common";

export default function SettingsPage() {
  const [readReceipts, setReadReceipts] = useState(true);
  const [ephemeralTimer, setEphemeralTimer] = useState("7 days");
  const [notifications, setNotifications] = useState(true);

  const sections = [
    {
      title: "Account & Keys",
      items: [
        {
          label: "Assigned User Identifier",
          desc: "Assigned #482910",
          action: "view",
        },
        {
          label: "Export Identity Keyring",
          desc: "Offline cryptographic backup",
          action: "export",
        },
      ],
    },
    {
      title: "Privacy & Encryption",
      items: [
        {
          label: "Read Receipts",
          desc: "Show checkmarks when messages are viewed",
          toggle: true,
          value: readReceipts,
          onToggle: () => setReadReceipts(!readReceipts),
        },
        {
          label: "Disappearing Messages",
          desc: `Default timer: ${ephemeralTimer}`,
          action: "select",
        },
        {
          label: "Blind Relay Routing",
          desc: "Active via Zurich Node",
          badge: "Enabled",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Notifications",
          desc: "Alerts for incoming calls and messages",
          toggle: true,
          value: notifications,
          onToggle: () => setNotifications(!notifications),
        },
        {
          label: "Appearance",
          desc: "System neutral (Light / Dark responsive)",
          action: "select",
        },
        {
          label: "Local Storage & Cache",
          desc: "14.2 MB cached files",
          action: "clean",
        },
      ],
    },
    {
      title: "System & About",
      items: [
        {
          label: "Protocol Specification",
          desc: "SignalCore Double-Ratchet v2.4",
          badge: "v2.4",
        },
        {
          label: "Zero-Knowledge Audit",
          desc: "Verified October 2026",
          badge: "Passed",
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Settings
          </h1>
        </div>
      </header>

      {/* Grouped settings rows */}
      <main className="flex-1 overflow-y-auto pb-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mt-4">
            <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6C716D] bg-[#FAFAF8] border-y border-[#E3E5E1]/60">
              {section.title}
            </div>

            <div className="divide-y divide-[#E3E5E1]/40">
              {section.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-semibold text-[#181A19]">
                      {item.label}
                    </div>
                    {item.desc && (
                      <div className="text-[11px] text-[#6C716D] mt-0.5">
                        {item.desc}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {item.toggle ? (
                      <button
                        type="button"
                        onClick={item.onToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          item.value ? "bg-[#1F5C4A]" : "bg-[#E3E5E1]"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    ) : item.badge ? (
                      <span className="rounded bg-[#E8F2EE] px-2 py-0.5 text-[10px] font-semibold text-[#1F5C4A]">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#9B9E9C]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div className="mt-6 px-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B94A48]">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </div>
            <p className="mt-1 text-[11px] text-[#B94A48]/80 leading-relaxed">
              Purging your identity deletes the local cryptographic enclave keys and severs all existing connection channels.
            </p>
            <button
              type="button"
              onClick={() => alert("Cryptographic identity purge confirmed.")}
              className="mt-3 rounded-lg bg-[#B94A48] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#9E3B3A]"
            >
              Destroy Identity Keys
            </button>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
