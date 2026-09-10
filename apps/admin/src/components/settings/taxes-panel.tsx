"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { TaxFormModal } from "@/components/settings/tax-form-modal";
import {
  Alert,
  Badge,
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
  TAX_TYPE_LABELS,
  TAX_TYPES,
  type Country,
  type Tax,
  type TaxType,
} from "@/lib/settings";

const PAGE_SIZE = 20;

export function TaxesPanel() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [taxType, setTaxType] = useState("");
  const [countryId, setCountryId] = useState("");
  const [isActive, setIsActive] = useState("");

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Tax[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tax | null>(null);
  const [deleting, setDeleting] = useState<Tax | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const countryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries) map.set(c.id, c.code);
    return map;
  }, [countries]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiFetch<PaginatedResponse<Country>>(
          "/countries?page=1&pageSize=100",
        );
        if (!cancelled) setCountries(result.data);
      } catch {
        if (!cancelled) setCountries([]);
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
      if (search.trim()) query.set("search", search.trim());
      if (taxType) query.set("taxType", taxType);
      if (countryId) query.set("countryId", countryId);
      if (isActive === "true" || isActive === "false") {
        query.set("isActive", isActive);
      }
      const result = await apiFetch<PaginatedResponse<Tax>>(
        `/taxes?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les taxes",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, taxType, countryId, isActive]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/taxes/${deleting.id}`, { method: "DELETE" });
      toast({ title: "Taxe archivée", tone: "success" });
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
            <span className="font-medium" id="taxes-search-label">
              Recherche
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="taxes-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearch(searchInput);
                  }
                }}
                placeholder="Code ou nom…"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPage(1);
                  setSearch(searchInput);
                }}
              >
                Filtrer
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Type</span>
            <Select
              value={taxType}
              onChange={(e) => {
                setPage(1);
                setTaxType(e.target.value);
              }}
            >
              <option value="">Tous</option>
              {TAX_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TAX_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Pays</span>
            <Select
              value={countryId}
              onChange={(e) => {
                setPage(1);
                setCountryId(e.target.value);
              }}
            >
              <option value="">Tous</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Statut</span>
            <Select
              value={isActive}
              onChange={(e) => {
                setPage(1);
                setIsActive(e.target.value);
              }}
            >
              <option value="">Tous</option>
              <option value="true">Actives</option>
              <option value="false">Inactives</option>
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
            Nouvelle taxe
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
          <Spinner label="Chargement des taxes…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune taxe"
          description="Créez une taxe ou ajustez les filtres."
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
                Nouvelle taxe
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Libellé</Th>
                <Th>Taux %</Th>
                <Th>Type</Th>
                <Th>Pays</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.code}</Td>
                  <Td>{row.name}</Td>
                  <Td className="font-mono text-sm">
                    {formatDecimalDisplay(row.rate)}
                  </Td>
                  <Td>
                    {TAX_TYPE_LABELS[row.taxType as TaxType] ?? row.taxType}
                  </Td>
                  <Td className="text-muted">
                    {row.countryId
                      ? (countryLabelById.get(row.countryId) ?? "—")
                      : "Global"}
                  </Td>
                  <Td>
                    <Badge tone={row.isActive ? "success" : "neutral"}>
                      {row.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
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

      <TaxFormModal
        open={formOpen}
        tax={editing}
        countries={countries}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Taxe mise à jour" : "Taxe créée",
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
        title="Archiver la taxe"
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
          Archiver{" "}
          <span className="font-medium text-foreground">{deleting?.code}</span> ?
          L’élément ne sera plus visible dans les listes actives.
        </p>
      </Modal>
    </div>
  );
}
