"use client";

import { useState } from "react";
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
        title: "Seeds settings chargés",
        description: `${result.inserted} inséré(s), ${result.updated} mis à jour`,
        tone: "success",
      });
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : "Impossible d’exécuter le seed";
      setError(message);
      toast({
        title: "Seed impossible",
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
          <h2 className="text-sm font-semibold text-foreground">
            Seeds settings (dev)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Upsert idempotent des référentiels (devises, pays, villes, unités,
            Incoterms, conditions de paiement, taxes). Visible uniquement en
            développement — l’API refuse hors{" "}
            <code className="text-xs">NODE_ENV=development</code>.
          </p>
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
          Charger les seeds settings
        </Button>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur" className="mt-3">
          {error}
        </Alert>
      ) : null}

      {lastResult ? (
        <p className="mt-3 text-xs text-muted">
          Dernier run : {lastResult.inserted} insert · {lastResult.updated}{" "}
          update — devises {fmtBucket(lastResult.details.currencies)}, pays{" "}
          {fmtBucket(lastResult.details.countries)}, villes{" "}
          {fmtBucket(lastResult.details.cities)}, unités{" "}
          {fmtBucket(lastResult.details.units)}, Incoterms{" "}
          {fmtBucket(lastResult.details.shippingTerms)}, paiement{" "}
          {fmtBucket(lastResult.details.paymentTerms)}, taxes{" "}
          {fmtBucket(lastResult.details.taxes)}.
        </p>
      ) : null}

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!loading) setConfirmOpen(false);
        }}
        title="Charger les seeds settings ?"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void runSeed()}
              disabled={loading}
            >
              {loading ? "Chargement…" : "Confirmer l’upsert"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Opération{" "}
          <span className="font-medium text-foreground">non destructive</span>{" "}
          : upsert par code (insert ou mise à jour des lignes de référence).
          Les données métier hors catalogue seed ne sont pas effacées.
        </p>
      </Modal>
    </section>
  );
}

function fmtBucket(bucket: { inserted: number; updated: number }): string {
  return `+${bucket.inserted}/↻${bucket.updated}`;
}
