"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("documents.browse");
  const tStatus = useTranslations("documents.status");
  const tEntity = useTranslations("documents.entityTypes");
  const tDetail = useTranslations("documents.detail");
  const tCommon = useTranslations("common");

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
    for (const row of types) map.set(row.id, `${row.code} — ${row.name}`);
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
          setError(t("entityIdPlaceholder"));
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
        cause instanceof ApiError ? cause.message : t("loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, documentTypeId, status, entityType, entityId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setSearch(searchInput);
    setEntityId(entityIdInput);
  }

  function statusLabel(s: DocumentStatus | string): string {
    return DOCUMENT_STATUSES.includes(s as DocumentStatus)
      ? tStatus(s as DocumentStatus)
      : s;
  }

  function entityLabel(id: DocumentLinkEntityType): string {
    return tEntity(id);
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info" title={t("supportAlert")}>
        {t("pageLead")}
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{tCommon("search")}</span>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("docType")}</span>
          <Select
            value={documentTypeId}
            onChange={(e) => {
              setPage(1);
              setDocumentTypeId(e.target.value);
            }}
          >
            <option value="">{tCommon("all")}</option>
            {types.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} — {row.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("status")}</span>
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">{t("statusAll")}</option>
            {DOCUMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("entityType")}</span>
          <Select
            value={entityType}
            onChange={(e) => {
              setPage(1);
              setEntityType(e.target.value);
            }}
          >
            <option value="">{tCommon("all")}</option>
            {DOCUMENT_LINK_ENTITY_TYPES.map((id) => (
              <option key={id} value={id}>
                {entityLabel(id)} ({id})
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium" id="documents-entity-id-label">
            {t("entityId")}
          </span>
          <div className="flex gap-2">
            <Input
              aria-labelledby="documents-entity-id-label"
              value={entityIdInput}
              onChange={(e) => setEntityIdInput(e.target.value)}
              placeholder={t("entityIdPlaceholder")}
              className="font-mono"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
            <Button type="button" variant="secondary" onClick={applyFilters}>
              {tCommon("filter")}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Alert tone="danger" title={tCommon("error")}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label={t("loading")} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>{t("createdAt")}</Th>
                <Th>{t("title")}</Th>
                <Th>{t("fileName")}</Th>
                <Th>{t("docType")}</Th>
                <Th>{t("status")}</Th>
                <Th>{tDetail("mimeType")}</Th>
                <Th className="text-right">{tCommon("detail")}</Th>
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
                      ? (typeLabelById.get(row.documentTypeId) ??
                        tCommon("emDash"))
                      : tCommon("emDash")}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        STATUS_BADGE[row.status as DocumentStatus] ?? "neutral"
                      }
                    >
                      {statusLabel(row.status)}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs text-muted">
                    {row.mimeType ?? tCommon("emDash")}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelected(row)}
                      >
                        {tCommon("view")}
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
