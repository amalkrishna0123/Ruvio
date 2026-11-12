"use client";

import React from "react";
import MobileShell from "@/components/layout/MobileShell";
import IncomingCallOverlay from "@/components/common/IncomingCallOverlay";

/**
 * Authenticated layout — wraps all authenticated routes in the mobile shell
 * and renders the global incoming call overlay.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileShell>
      <IncomingCallOverlay />
      {children}
    </MobileShell>
  );
}
