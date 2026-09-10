import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui";

type ErrorPageShellProps = {
  code: string;
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * Shared chrome for 403 / 404 / error boundary pages (outside app shell).
 */
export function ErrorPageShell({
  code,
  title,
  description,
  action,
}: ErrorPageShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <main className="w-full max-w-lg">
        <p className="mb-3 text-center text-sm font-medium tracking-wide text-primary uppercase">
          Sinfinity Admin · {code}
        </p>
        <EmptyState
          title={title}
          description={description}
          action={action}
          className="border-solid bg-surface shadow-sm"
        />
      </main>
    </div>
  );
}

export function ErrorPageLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      : "inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
