"use client";

import { useCallback, useEffect, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { DocumentTypeFormModal } from "@/components/documents/document-type-form-modal";
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
import type { DocumentType } from "@/lib/documents";

const PAGE_SIZE = 20;

function mimePreview(mimes: string[] | null): string {
  if (!mimes?.length) return "—";
  const joined = mimes.join(", ");
  return joined.length > 48 ? `${joined.slice(0, 45)}…` : joined;
}

export function DocumentTypesPanel() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("documents.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isSystem, setIsSystem] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DocumentType[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [deleting, setDeleting] = useState<DocumentType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) query.set("search", search.trim());
      if (isSystem === "true" || isSystem === "false") {
        query.set("isSystem", isSystem);
      }
      const result = await apiFetch<PaginatedResponse<DocumentType>>(
        `/document-types?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les types",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, isSystem]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setSearch(searchInput);
  }

  function canEditRow(row: DocumentType): boolean {
    if (!canWrite) return false;
    if (row.isSystem) return isSuperAdmin;
    return true;
  }

  function canDeleteRow(row: DocumentType): boolean {
    return canWrite && !row.isSystem;
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/document-types/${deleting.id}`, {
        method: "DELETE",
      });
      toast({ title: "Type supprimé", tone: "success" });
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
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Recherche</span>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Code ou nom…"
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <Button type="button" variant="secondary" onClick={applyFilters}>
                Filtrer
              </Button>
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Portée</span>
            <Select
              value={isSystem}
              onChange={(e) => {
                setPage(1);
                setIsSystem(e.target.value);
              }}
            >
              <option value="">Tous</option>
              <option value="true">Système</option>
              <option value="false">Organisation</option>
            </Select>
          </label>
        </div>
        <Can permission="documents.write">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nouveau type
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
          <Spinner label="Chargement des types…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun type"
          description="Créez un type organisation ou ajustez les filtres."
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
                Nouveau type
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
                <Th>MIME</Th>
                <Th>Portée</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.code}</Td>
                  <Td>{row.name}</Td>
                  <Td
                    className="max-w-[12rem] truncate font-mono text-xs text-muted"
                    title={row.allowedMimeTypes?.join(", ") ?? undefined}
                  >
                    {mimePreview(row.allowedMimeTypes)}
                  </Td>
                  <Td>
                    <Badge tone={row.isSystem ? "neutral" : "primary"}>
                      {row.isSystem ? "Système" : "Org"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {canEditRow(row) ? (
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
                      ) : null}
                      {canDeleteRow(row) ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(row)}
                        >
                          Supprimer
                        </Button>
                      ) : null}
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

      <DocumentTypeFormModal
        open={formOpen}
        documentType={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Type mis à jour" : "Type créé",
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
        title="Supprimer le type"
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
              {deleteLoading ? "Suppression…" : "Confirmer"}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          Suppression définitive de{" "}
          <span className="font-mono font-medium text-foreground">
            {deleting?.code}
          </span>
          . Échoue si des documents y sont encore rattachés.
        </p>
      </Modal>
    </div>
  );
}
