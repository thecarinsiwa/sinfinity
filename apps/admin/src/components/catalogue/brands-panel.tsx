"use client";

import { useCallback, useEffect, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandFormModal } from "@/components/catalogue/brand-form-modal";
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
import type { ProductBrand } from "@/lib/catalogue";

const PAGE_SIZE = 20;

export function BrandsPanel() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("catalog.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProductBrand[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductBrand | null>(null);
  const [deleting, setDeleting] = useState<ProductBrand | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) query.set("search", search.trim());
      const result = await apiFetch<PaginatedResponse<ProductBrand>>(
        `/product-brands?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les marques",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setSearch(searchInput);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/product-brands/${deleting.id}`, {
        method: "DELETE",
      });
      toast({ title: "Marque archivée", tone: "success" });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium" id="brands-search-label">
            Recherche
          </span>
          <div className="flex gap-2">
            <Input
              aria-labelledby="brands-search-label"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nom…"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
            <Button type="button" variant="secondary" onClick={applyFilters}>
              Filtrer
            </Button>
          </div>
        </div>
        <Can permission="catalog.write">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nouvelle marque
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
          <Spinner label="Chargement des marques…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune marque"
          description="Créez une marque ou ajustez la recherche."
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
                Nouvelle marque
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Nom</Th>
                <Th>Site</Th>
                <Th>Logo</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-medium">{row.name}</Td>
                  <Td className="max-w-[14rem] truncate text-sm text-muted">
                    {row.website ? (
                      <a
                        href={row.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {row.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td
                    className="max-w-[10rem] truncate font-mono text-xs text-muted"
                    title={row.logoUrl ?? undefined}
                  >
                    {row.logoUrl ?? "—"}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="catalog.write">
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

      <BrandFormModal
        open={formOpen}
        brand={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Marque mise à jour" : "Marque créée",
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
        title="Archiver la marque"
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
          <span className="font-medium text-foreground">{deleting?.name}</span> ?
          L’élément ne sera plus visible dans les listes actives.
        </p>
      </Modal>
    </div>
  );
}
