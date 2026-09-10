"use client";

import { useCallback, useEffect, useState } from "react";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { BranchFormModal } from "@/components/organisation/branch-form-modal";
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
  BRANCH_TYPE_LABELS,
  BRANCH_TYPES,
  type Branch,
} from "@/lib/organisation";

const PAGE_SIZE = 20;

function buildBranchesQuery(params: {
  page: number;
  search: string;
  type: string;
  isActive: string;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(PAGE_SIZE));
  if (params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.type) {
    query.set("type", params.type);
  }
  if (params.isActive === "true" || params.isActive === "false") {
    query.set("isActive", params.isActive);
  }
  return `/branches?${query.toString()}`;
}

export function BranchesPanel() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("branches.write");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [isActive, setIsActive] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PaginatedResponse<Branch>>(
        buildBranchesQuery({ page, search, type, isActive }),
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les agences",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, type, isActive]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/branches/${deleting.id}`, { method: "DELETE" });
      toast({ title: "Agence archivée", tone: "success" });
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
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium" id="branches-search-label">
              Recherche
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="branches-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Code ou nom…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearch(searchInput);
                  }
                }}
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
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
            >
              <option value="">Tous</option>
              {BRANCH_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BRANCH_TYPE_LABELS[t]}
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

        <Can permission="branches.write">
          <Button type="button" onClick={openCreate}>
            Nouvelle agence
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
          <Spinner label="Chargement des agences…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune agence"
          description="Créez une agence ou ajustez les filtres."
          action={
            canWrite ? (
              <Button type="button" size="sm" onClick={openCreate}>
                Nouvelle agence
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
                <Th>Type</Th>
                <Th>Téléphone</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((branch) => (
                <Tr key={branch.id}>
                  <Td className="font-mono text-xs">{branch.code}</Td>
                  <Td>{branch.name}</Td>
                  <Td>{BRANCH_TYPE_LABELS[branch.type]}</Td>
                  <Td className="text-muted">{branch.phone ?? "—"}</Td>
                  <Td>
                    <Badge tone={branch.isActive ? "success" : "neutral"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="branches.write">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(branch)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(branch)}
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

      <BranchFormModal
        open={formOpen}
        branch={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? "Agence mise à jour" : "Agence créée",
            tone: "success",
          });
          void load();
        }}
      />

      <Modal
        open={deleting !== null}
        onClose={() => {
          if (!deleteLoading) {
            setDeleting(null);
          }
        }}
        title="Archiver l’agence"
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
          <span className="font-medium text-foreground">
            {deleting?.name ?? ""}
          </span>{" "}
          ({deleting?.code}) ? L’élément ne sera plus visible dans les listes
          actives.
        </p>
      </Modal>
    </div>
  );
}
