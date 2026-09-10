"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export function DocumentTypesPanel() {
  const t = useTranslations("documents.types");
  const tCommon = useTranslations("common");
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

  function mimePreview(mimes: string[] | null): string {
    if (!mimes?.length) return tCommon("emDash");
    const joined = mimes.join(", ");
    return joined.length > 48 ? `${joined.slice(0, 45)}…` : joined;
  }

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
        cause instanceof ApiError ? cause.message : t("loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, isSystem, t]);

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
      toast({ title: t("toastDeleted"), tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (cause) {
      toast({
        title: tCommon("deleteFailed"),
        description:
          cause instanceof ApiError
            ? cause.message
            : tCommon("genericError"),
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
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium" id="document-types-search-label">
              {tCommon("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="document-types-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <Button type="button" variant="secondary" onClick={applyFilters}>
                {tCommon("filter")}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("scope")}</span>
            <Select
              value={isSystem}
              onChange={(e) => {
                setPage(1);
                setIsSystem(e.target.value);
              }}
            >
              <option value="">{t("scopeAll")}</option>
              <option value="true">{t("scopeSystem")}</option>
              <option value="false">{t("scopeOrg")}</option>
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
            {t("new")}
          </Button>
        </Can>
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
                {t("new")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>{tCommon("code")}</Th>
                <Th>{tCommon("name")}</Th>
                <Th>{t("mime")}</Th>
                <Th>{t("scope")}</Th>
                <Th className="text-right">{tCommon("actions")}</Th>
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
                      {row.isSystem ? t("system") : t("scopeOrg")}
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
                          {tCommon("edit")}
                        </Button>
                      ) : null}
                      {canDeleteRow(row) ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(row)}
                        >
                          {tCommon("delete")}
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
            title: editing ? t("toastUpdated") : t("toastCreated"),
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
        title={t("deleteTitle")}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? tCommon("deleting") : tCommon("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          {t("deleteBody", {
            name: deleting?.name ?? "",
            code: deleting?.code ?? "",
          })}
        </p>
      </Modal>
    </div>
  );
}
