"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentDetailDrawer } from "@/components/documents/document-detail-drawer";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
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
import { ApiError, apiFetch, type PaginatedResponse } from "@/lib/api";
import {
  DOCUMENT_LINK_ENTITY_TYPES,
  DOCUMENT_LINK_ENTITY_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUSES,
  type Document,
  type DocumentLinkEntityType,
  type DocumentStatus,
  type DocumentType,
} from "@/lib/documents";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<DocumentStatus, "success" | "warning" | "danger"> = {
  active: "success",
  archived: "warning",
  deleted: "danger",
};

export function DocumentsBrowsePanel() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [entityIdInput, setEntityIdInput] = useState("");
  const [search, setSearch] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");

  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Document | null>(null);

  const typeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of types) map.set(t.id, `${t.code} — ${t.name}`);
    return map;
  }, [types]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiFetch<PaginatedResponse<DocumentType>>(
          "/document-types?page=1&pageSize=100",
        );
        if (!cancelled) setTypes(result.data);
      } catch {
        if (!cancelled) setTypes([]);
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
      if (documentTypeId) query.set("documentTypeId", documentTypeId);
      if (status) query.set("status", status);
      if (entityType) query.set("entityType", entityType);
      if (entityId.trim()) {
        if (!entityType) {
          setError("entityType est requis lorsque entityId est renseigné");
          setItems([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        query.set("entityId", entityId.trim());
      }
      const result = await apiFetch<PaginatedResponse<Document>>(
        `/documents?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les documents",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, documentTypeId, status, entityType, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setSearch(searchInput);
    setEntityId(entityIdInput);
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info" title="Outil support">
        Exploration lecture seule — pas de remplacement du module Documents Web
        (pas d’upload ni de téléchargement ici).
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Recherche</span>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Titre ou fichier…"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <Select
            value={documentTypeId}
            onChange={(e) => {
              setPage(1);
              setDocumentTypeId(e.target.value);
            }}
          >
            <option value="">Tous</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Statut</span>
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Actifs + archivés</option>
            {DOCUMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DOCUMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">entity_type</span>
          <Select
            value={entityType}
            onChange={(e) => {
              setPage(1);
              setEntityType(e.target.value);
            }}
          >
            <option value="">Tous</option>
            {DOCUMENT_LINK_ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_LINK_ENTITY_TYPE_LABELS[t as DocumentLinkEntityType]} (
                {t})
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">entity_id (UUID)</span>
          <div className="flex gap-2">
            <Input
              value={entityIdInput}
              onChange={(e) => setEntityIdInput(e.target.value)}
              placeholder="Requiert entity_type"
              className="font-mono"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
            <Button type="button" variant="secondary" onClick={applyFilters}>
              Filtrer
            </Button>
          </div>
        </label>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des documents…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun document"
          description="Aucun fichier ne correspond aux filtres."
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Titre</Th>
                <Th>Fichier</Th>
                <Th>Type</Th>
                <Th>Statut</Th>
                <Th>MIME</Th>
                <Th className="text-right">Détail</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {row.createdAt.slice(0, 19).replace("T", " ")}
                  </Td>
                  <Td>{row.title}</Td>
                  <Td
                    className="max-w-[10rem] truncate font-mono text-xs"
                    title={row.fileName}
                  >
                    {row.fileName}
                  </Td>
                  <Td className="text-xs text-muted">
                    {row.documentTypeId
                      ? (typeLabelById.get(row.documentTypeId) ?? "—")
                      : "—"}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        STATUS_BADGE[row.status as DocumentStatus] ?? "neutral"
                      }
                    >
                      {DOCUMENT_STATUS_LABELS[row.status as DocumentStatus] ??
                        row.status}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs text-muted">
                    {row.mimeType ?? "—"}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelected(row)}
                      >
                        Voir
                      </Button>
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

      <DocumentDetailDrawer
        open={selected !== null}
        document={selected}
        typeLabel={
          selected?.documentTypeId
            ? typeLabelById.get(selected.documentTypeId)
            : undefined
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
