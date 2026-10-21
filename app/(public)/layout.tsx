import MobileShell from "@/components/layout/MobileShell";

/**
 * Public layout — no authenticated navigation.
 * Uses the mobile shell for consistent container sizing.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell>{children}</MobileShell>;
}
