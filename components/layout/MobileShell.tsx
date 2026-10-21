/**
 * MobileShell
 * Centers the 430px app container on desktop; full-width on mobile.
 */
export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-start justify-center bg-[var(--color-bg)]">
      <div className="app-shell">{children}</div>
    </div>
  );
}
