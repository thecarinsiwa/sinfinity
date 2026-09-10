"use client";

import { useCallback, useEffect, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { UnitFormModal } from "@/components/settings/unit-form-modal";
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
  UNIT_TYPE_LABELS,
  UNIT_TYPES,
  type Unit,
  type UnitType,
} from "@/lib/settings";

const PAGE_SIZE = 20;

export function UnitsPanel() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [codeInput, setCodeInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [unitType, setUnitType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Unit[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (code.trim()) query.set("code", code.trim().toUpperCase());
      if (search.trim()) query.set("search", search.trim());
      if (unitType) query.set("unitType", unitType);
      const result = await apiFetch<PaginatedResponse<Unit>>(
        `/units?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les unités",
      );
    } finally {
      setLoading(false);
    }
  }, [page, code, search, unitType]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setCode(codeInput);
    setSearch(searchInput);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/units/${deleting.id}`, { method: "DELETE" });
      toast({ title: "Unité archivée", tone: "success" });
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
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Code</span>
            <Input
              maxLength={32}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="PCS"
              className="uppercase"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Recherche</span>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nom…"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium" id="units-type-label">
              Type
            </span>
            <div className="flex gap-2">
              <Select
                aria-labelledby="units-type-label"
                value={unitType}
                onChange={(e) => {
                  setPage(1);
                  setUnitType(e.target.value);
                }}
              >
                <option value="">Tous</option>
                {UNIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {UNIT_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={applyFilters}>
                Filtrer
              </Button>
            </div>
          </div>
        </div>
        <Can permission="settings.write">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nouvelle unité
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
          <Spinner label="Chargement des unités…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune unité"
          description="Créez une unité ou ajustez les filtres."
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
                Nouvelle unité
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
                <Th>Nom</Th>
                <Th>Symbole</Th>
                <Th>Type</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.code}</Td>
                  <Td>{row.name}</Td>
                  <Td className="text-muted">{row.symbol ?? "—"}</Td>
                  <Td>
                    {UNIT_TYPE_LABELS[row.unitType as UnitType] ?? row.unitType}
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

      <UnitFormModal
        open={formOpen}
        unit={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Unité mise à jour" : "Unité créée",
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
        title="Archiver l'unité"
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
