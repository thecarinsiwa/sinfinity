"use client";

import { useCallback, useEffect, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { CountryFormModal } from "@/components/settings/country-form-modal";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  Modal,
  Pagination,
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
import type { Country } from "@/lib/settings";

const PAGE_SIZE = 20;

export function CountriesPanel() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [codeInput, setCodeInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Country[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState<Country | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (code.trim().length === 2) {
        query.set("code", code.trim().toUpperCase());
      }
      if (search.trim()) {
        query.set("search", search.trim());
      }
      const result = await apiFetch<PaginatedResponse<Country>>(
        `/countries?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les pays",
      );
    } finally {
      setLoading(false);
    }
  }, [page, code, search]);

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
      await apiFetch<void>(`/countries/${deleting.id}`, { method: "DELETE" });
      toast({ title: "Pays archivé", tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Code ISO</span>
            <Input
              maxLength={2}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="CD"
              className="uppercase"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </label>
          <div className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium" id="countries-search-label">
              Recherche
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="countries-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nom du pays…"
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
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
            Nouveau pays
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
          <Spinner label="Chargement des pays…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun pays"
          description="Créez un pays ou ajustez les filtres."
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
                Nouveau pays
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
                <Th>Code3</Th>
                <Th>Nom</Th>
                <Th>Tél.</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((country) => (
                <Tr key={country.id}>
                  <Td className="font-mono text-xs">{country.code}</Td>
                  <Td className="font-mono text-xs text-muted">
                    {country.code3 ?? "—"}
                  </Td>
                  <Td>{country.name}</Td>
                  <Td className="text-muted">{country.phoneCode ?? "—"}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="settings.write">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(country);
                            setFormOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(country)}
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

      <CountryFormModal
        open={formOpen}
        country={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Pays mis à jour" : "Pays créé",
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
        title="Archiver le pays"
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
          <span className="font-medium text-foreground">{deleting?.name}</span> (
          {deleting?.code}) ? L’élément ne sera plus visible dans les listes
          actives.
        </p>
      </Modal>
    </div>
  );
}
