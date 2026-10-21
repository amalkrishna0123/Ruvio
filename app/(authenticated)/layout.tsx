import MobileShell from "@/components/layout/MobileShell";

/**
 * Authenticated layout — wraps all authenticated routes in the mobile shell.
 * Authentication checks will be added here later.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell>{children}</MobileShell>;
}
