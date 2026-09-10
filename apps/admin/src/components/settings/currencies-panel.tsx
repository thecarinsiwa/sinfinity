"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { CurrencyFormModal } from "@/components/settings/currency-form-modal";
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
import type { Currency } from "@/lib/settings";

const PAGE_SIZE = 20;

export function CurrenciesPanel() {
  const t = useTranslations("settings.currencies");
  const tc = useTranslations("common");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [codeInput, setCodeInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Currency[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [deleting, setDeleting] = useState<Currency | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (code.trim().length === 3) {
        query.set("code", code.trim().toUpperCase());
      }
      if (search.trim()) {
        query.set("search", search.trim());
      }
      if (isActive === "true" || isActive === "false") {
        query.set("isActive", isActive);
      }
      const result = await apiFetch<PaginatedResponse<Currency>>(
        `/currencies?${query.toString()}`,
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
  }, [page, code, search, isActive, t]);

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
      await apiFetch<void>(`/currencies/${deleting.id}`, { method: "DELETE" });
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
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tc("code")}</span>
            <Input
              maxLength={3}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="USD"
              className="uppercase"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tc("search")}</span>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium" id="currencies-status-label">
              {tc("status")}
            </span>
            <div className="flex gap-2">
              <Select
                aria-labelledby="currencies-status-label"
                value={isActive}
                onChange={(e) => {
                  setPage(1);
                  setIsActive(e.target.value);
                }}
              >
                <option value="">{tc("all")}</option>
                <option value="true">{tc("actives")}</option>
                <option value="false">{tc("inactives")}</option>
              </Select>
              <Button type="button" variant="secondary" onClick={applyFilters}>
                {tc("filter")}
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
                <Th>{tc("symbol")}</Th>
                <Th>{t("decimals")}</Th>
                <Th>{tc("status")}</Th>
                <Th className="text-right">{tc("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((currency) => (
                <Tr key={currency.id}>
                  <Td className="font-mono text-xs">{currency.code}</Td>
                  <Td>{currency.name}</Td>
                  <Td>{currency.symbol}</Td>
                  <Td>{currency.decimalPlaces}</Td>
                  <Td>
                    <Badge tone={currency.isActive ? "success" : "neutral"}>
                      {currency.isActive ? tc("active") : tc("inactive")}
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
                            setEditing(currency);
                            setFormOpen(true);
                          }}
                        >
                          {tc("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(currency)}
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

      <CurrencyFormModal
        open={formOpen}
        currency={editing}
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
