"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { Alert, Button, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { ApiError, apiFetch } from "@/lib/api";
import type { SettingsSeedResult } from "@/lib/settings";

/**
 * Dev-only upsert of global settings referentials via POST /settings/seed.
 * Hidden when NODE_ENV=production (API also rejects non-development).
 */
export function SettingsSeedAction() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Can permission="settings.write">
      <SettingsSeedActionInner />
    </Can>
  );
}

function SettingsSeedActionInner() {
  const t = useTranslations("settings.seed");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SettingsSeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSeed() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<SettingsSeedResult>("/settings/seed", {
        method: "POST",
      });
      setLastResult(result);
      setConfirmOpen(false);
      toast({
        title: t("successTitle"),
        description: t("successBody", {
          inserted: result.inserted,
          updated: result.updated,
        }),
        tone: "success",
      });
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : tc("genericError");
      setError(message);
      toast({
        title: t("errorTitle"),
        description: message,
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("lead")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
          disabled={loading}
        >
          {t("action")}
        </Button>
      </div>

      {error ? (
        <Alert tone="danger" title={tc("error")} className="mt-3">
          {error}
        </Alert>
      ) : null}

      {lastResult ? (
        <p className="mt-3 text-xs text-muted">
          {t("successBody", {
            inserted: lastResult.inserted,
            updated: lastResult.updated,
          })}
        </p>
      ) : null}

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!loading) setConfirmOpen(false);
        }}
        title={t("confirmTitle")}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void runSeed()}
              disabled={loading}
            >
              {loading ? t("loading") : tc("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{t("confirmBody")}</p>
      </Modal>
    </section>
  );
}
