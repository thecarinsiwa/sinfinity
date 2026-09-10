import Link from "next/link";
import type { ReactNode } from "react";

export function DocumentsSubpage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm">
          <Link
            href="/documents"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ← Documents
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
