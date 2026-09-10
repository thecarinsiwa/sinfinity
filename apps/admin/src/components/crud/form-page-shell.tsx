"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * FormPageShell — chrome partagé pour les pages CRUD plein écran (`/nouveau`, `/[id]/edit`).
 *
 * API :
 * - `title` / `description?` — en-tête (souvent `useFormPageMessages().createTitle/editTitle`)
 * - `breadcrumbs` — fil hub → liste → nouveau|édition ; dernier item sans `href` = courant
 *   (crumbs courant : `createCrumb` / `editCrumb`)
 * - `formId` — id du `<form>` enfant ; Enregistrer = `form={formId}` + `type="submit"`
 * - `cancelHref` — cible Annuler (liste)
 * - `children` — caller enveloppe avec `<form id={formId} onSubmit=…>`
 * - `loading?` / `error?` — slots fetch édition (`loadFailed` / `notFound` côté page)
 * - `saving?` / `saveDisabled?` — état submit
 * - `stickyActions?` (défaut true)
 * - labels optionnels : sinon `common.cancel` / `common.save` / `common.saving` / `common.loading`
 *   (`common.formPage.cancel|save` existent avec le même libellé pour les pages qui lisent formPage)
 *
 * Toasts succès : `common.formPage.saveSuccess` (hors shell).
 * Ne gère pas la validation ni l’appel API — uniquement le chrome.
 */
export type FormPageBreadcrumb = {
  label: string;
  href?: string;
};

export type FormPageShellProps = {
  title: string;
  description?: string;
  breadcrumbs: FormPageBreadcrumb[];
  formId: string;
  cancelHref: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  saving?: boolean;
  saveDisabled?: boolean;
  stickyActions?: boolean;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
  loadingLabel?: string;
  className?: string;
};

const cancelLinkClass = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors",
  "border-border bg-surface text-foreground hover:bg-surface-muted",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

export function FormPageShell({
  title,
  description,
  breadcrumbs,
  formId,
  cancelHref,
  children,
  loading = false,
  error = null,
  saving = false,
  saveDisabled = false,
  stickyActions = true,
  cancelLabel,
  saveLabel,
  savingLabel,
  loadingLabel,
  className,
}: FormPageShellProps) {
  const t = useTranslations("common.formPage");
  const tc = useTranslations("common");
  const showForm = !loading && !error;

  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6", className)}>
      <nav aria-label={t("breadcrumb")} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <span aria-hidden className="text-border-strong">
                    /
                  </span>
                ) : null}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? "font-medium text-foreground" : undefined}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </header>

      <div className="min-w-0">
        {loading ? (
          <div className="flex justify-center rounded-lg border border-border bg-surface px-4 py-12 shadow-sm">
            <Spinner label={loadingLabel ?? tc("loading")} />
          </div>
        ) : null}

        {error && !loading ? (
          <Alert tone="danger" title={tc("error")}>
            {error}
          </Alert>
        ) : null}

        {showForm ? children : null}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/95 pt-4",
          stickyActions &&
            "sticky bottom-0 z-10 -mx-4 px-4 pb-4 backdrop-blur-sm md:-mx-6 md:px-6",
        )}
      >
        <Link href={cancelHref} className={cancelLinkClass}>
          {cancelLabel ?? tc("cancel")}
        </Link>
        {showForm ? (
          <Button
            type="submit"
            form={formId}
            disabled={saving || saveDisabled}
          >
            {saving
              ? (savingLabel ?? tc("saving"))
              : (saveLabel ?? tc("save"))}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
