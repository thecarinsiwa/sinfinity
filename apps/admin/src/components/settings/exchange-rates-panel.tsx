"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { ExchangeRateFormModal } from "@/components/settings/exchange-rate-form-modal";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { ApiError, apiFetch, type PaginatedResponse } from "@/lib/api";
import {
  formatDecimalDisplay,
  type Currency,
  type ExchangeRate,
} from "@/lib/settings";

const PAGE_SIZE = 20;

export function ExchangeRatesPanel() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [page, setPage] = useState(1);
  const [fromCurrencyId, setFromCurrencyId] = useState("");
  const [toCurrencyId, setToCurrencyId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ExchangeRate[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExchangeRate | null>(null);
  const [deleting, setDeleting] = useState<ExchangeRate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [latestFrom, setLatestFrom] = useState("USD");
  const [latestTo, setLatestTo] = useState("CDF");
  const [latestDate, setLatestDate] = useState("");
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<ExchangeRate | null>(null);
  const [latestError, setLatestError] = useState<string | null>(null);

  const codeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of currencies) map.set(c.id, c.code);
    return map;
  }, [currencies]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiFetch<PaginatedResponse<Currency>>(
          "/currencies?page=1&pageSize=100&isActive=true",
        );
        if (!cancelled) setCurrencies(result.data);
      } catch {
        if (!cancelled) setCurrencies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (fromCurrencyId) query.set("fromCurrencyId", fromCurrencyId);
      if (toCurrencyId) query.set("toCurrencyId", toCurrencyId);
      const result = await apiFetch<PaginatedResponse<ExchangeRate>>(
        `/exchange-rates?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les taux",
      );
    } finally {
      setLoading(false);
    }
  }, [page, fromCurrencyId, toCurrencyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function lookupLatest() {
    setLatestLoading(true);
    setLatestError(null);
    setLatestResult(null);
    try {
      const query = new URLSearchParams();
      query.set("from", latestFrom.trim().toUpperCase());
      query.set("to", latestTo.trim().toUpperCase());
      if (latestDate) query.set("date", latestDate);
      const result = await apiFetch<ExchangeRate>(
        `/exchange-rates/latest?${query.toString()}`,
      );
      setLatestResult(result);
    } catch (cause) {
      setLatestError(
        cause instanceof ApiError ? cause.message : "Aucun taux trouvé",
      );
    } finally {
      setLatestLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/exchange-rates/${deleting.id}`, {
        method: "DELETE",
      });
      toast({ title: "Taux archivé", tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (cause) {
      toast({
        title: "Suppression impossible",
        description:
          cause instanceof ApiError ? cause.message : "Une erreur est survenue",
        tone: "danger",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Dernier taux
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">From (ISO)</span>
            <Input
              maxLength={3}
              value={latestFrom}
              onChange={(e) => setLatestFrom(e.target.value)}
              className="uppercase"
              placeholder="USD"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">To (ISO)</span>
            <Input
              maxLength={3}
              value={latestTo}
              onChange={(e) => setLatestTo(e.target.value)}
              className="uppercase"
              placeholder="CDF"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Date (optionnel)</span>
            <Input
              type="date"
              value={latestDate}
              onChange={(e) => setLatestDate(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void lookupLatest()}
              disabled={
                latestLoading ||
                latestFrom.trim().length !== 3 ||
                latestTo.trim().length !== 3
              }
            >
              {latestLoading ? "Recherche…" : "Chercher"}
            </Button>
          </div>
        </div>
        {latestError ? (
          <p className="mt-3 text-sm text-danger">{latestError}</p>
        ) : null}
        {latestResult ? (
          <p className="mt-3 text-sm text-foreground">
            {latestFrom.toUpperCase()} → {latestTo.toUpperCase()} :{" "}
            <span className="font-mono font-medium">
              {formatDecimalDisplay(latestResult.rate)}
            </span>{" "}
            au {latestResult.rateDate.slice(0, 10)}
            {latestResult.source ? (
              <span className="text-muted"> ({latestResult.source})</span>
            ) : null}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Source</span>
            <Select
              value={fromCurrencyId}
              onChange={(e) => {
                setPage(1);
                setFromCurrencyId(e.target.value);
              }}
            >
              <option value="">Toutes</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Cible</span>
            <Select
              value={toCurrencyId}
              onChange={(e) => {
                setPage(1);
                setToCurrencyId(e.target.value);
              }}
            >
              <option value="">Toutes</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <Can permission="settings.write">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nouveau taux
          </Button>
        </Can>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des taux…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun taux"
          description="Créez un taux ou ajustez les filtres."
          action={
            canWrite ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Nouveau taux
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Paire</Th>
                <Th>Taux</Th>
                <Th>Date</Th>
                <Th>Source</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">
                    {codeById.get(row.fromCurrencyId) ?? "?"} →{" "}
                    {codeById.get(row.toCurrencyId) ?? "?"}
                  </Td>
                  <Td className="font-mono text-sm">
                    {formatDecimalDisplay(row.rate)}
                  </Td>
                  <Td>{row.rateDate.slice(0, 10)}</Td>
                  <Td className="text-muted">{row.source ?? "—"}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="settings.write">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(row);
                            setFormOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(row)}
                        >
                          Archiver
                        </Button>
                      </Can>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <ExchangeRateFormModal
        open={formOpen}
        rate={editing}
        currencies={currencies}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Taux mis à jour" : "Taux créé",
            tone: "success",
          });
          void load();
        }}
      />

      <Modal
        open={deleting !== null}
        onClose={() => {
          if (!deleteLoading) setDeleting(null);
        }}
        title="Archiver le taux"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Archivage…" : "Confirmer"}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          Archiver le taux{" "}
          <span className="font-mono text-foreground">
            {formatDecimalDisplay(deleting?.rate)}
          </span>{" "}
          ? L’élément ne sera plus visible dans les listes actives.
        </p>
      </Modal>
    </div>
  );
}
