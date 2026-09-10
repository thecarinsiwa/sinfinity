"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { PaymentTermFormModal } from "@/components/settings/payment-term-form-modal";
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
import type { PaymentTerm } from "@/lib/settings";

const PAGE_SIZE = 20;

export function PaymentTermsPanel() {
  const t = useTranslations("settings.paymentTerms");
  const tc = useTranslations("common");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [globalOnly, setGlobalOnly] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PaymentTerm[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [deleting, setDeleting] = useState<PaymentTerm | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) query.set("search", search.trim());
      if (globalOnly === "true") query.set("globalOnly", "true");
      const result = await apiFetch<PaginatedResponse<PaymentTerm>>(
        `/payment-terms?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(cause instanceof ApiError ? cause.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, search, globalOnly, t]);

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
      await apiFetch<void>(`/payment-terms/${deleting.id}`, {
        method: "DELETE",
      });
      toast({ title: t("toastArchived"), tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (cause) {
      toast({
        title: tc("deleteFailed"),
        description:
          cause instanceof ApiError ? cause.message : tc("genericError"),
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
            <span className="font-medium" id="payment-terms-search-label">
              {tc("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="payment-terms-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <Button type="button" variant="secondary" onClick={applyFilters}>
                {tc("filter")}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tc("scope")}</span>
            <Select
              value={globalOnly}
              onChange={(e) => {
                setPage(1);
                setGlobalOnly(e.target.value);
              }}
            >
              <option value="">{tc("allF")}</option>
              <option value="true">Global</option>
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
            {t("new")}
          </Button>
        </Can>
      </div>

      {error ? (
        <Alert tone="danger" title={tc("error")}>
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
                <Th>{tc("code")}</Th>
                <Th>{tc("name")}</Th>
                <Th>{t("daysDue")}</Th>
                <Th>{tc("scope")}</Th>
                <Th className="text-right">{tc("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.code}</Td>
                  <Td>
                    <div>{row.name}</div>
                    {row.description ? (
                      <div className="text-xs text-muted line-clamp-1">
                        {row.description}
                      </div>
                    ) : null}
                  </Td>
                  <Td>{row.daysDue}</Td>
                  <Td>
                    <Badge tone={row.organizationId ? "primary" : "neutral"}>
                      {row.organizationId ? tc("organization") : "Global"}
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
                          {tc("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(row)}
                        >
                          {tc("archive")}
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

      <PaymentTermFormModal
        open={formOpen}
        term={editing}
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
        title={t("archiveTitle")}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? tc("archiving") : tc("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          {t("archiveBody", { code: deleting?.code ?? "" })}
        </p>
      </Modal>
    </div>
  );
}
