"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { SystemSettingFormModal } from "@/components/systeme/system-setting-form-modal";
import {
  Alert,
  Button,
  EmptyState,
  Input,
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
import { stringifyJsonPretty, type SystemSetting } from "@/lib/ops";

const PAGE_SIZE = 20;

function previewValue(value: unknown): string {
  const pretty = stringifyJsonPretty(value);
  const oneLine = pretty.replace(/\s+/g, " ").trim();
  return oneLine.length > 80 ? `${oneLine.slice(0, 77)}…` : oneLine;
}

export function SystemSettingsPanel() {
  const t = useTranslations("systeme");
  const tCommon = useTranslations("common");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("system_settings.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SystemSetting[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemSetting | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) query.set("search", search.trim());
      const result = await apiFetch<PaginatedResponse<SystemSetting>>(
        `/system-settings?${query.toString()}`,
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
  }, [page, search, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium" id="system-settings-search-label">
            {tCommon("search")}
          </span>
          <div className="flex gap-2">
            <Input
              aria-labelledby="system-settings-search-label"
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
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/system/health"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            {tCommon("apiHealth")}
          </Link>
          <Can permission="system_settings.write">
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
                <Th>{t("key")}</Th>
                <Th>{t("value")}</Th>
                <Th>{tCommon("description")}</Th>
                <Th>updatedAt</Th>
                <Th className="text-right">{tCommon("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.key}</Td>
                  <Td>
                    <code className="text-xs text-muted">
                      {previewValue(row.value)}
                    </code>
                  </Td>
                  <Td className="text-muted">
                    {row.description ?? tCommon("emDash")}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted">
                    {row.updatedAt.slice(0, 19).replace("T", " ")}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(row);
                          setFormOpen(true);
                        }}
                      >
                        {canWrite ? t("edit") : t("view")}
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

      <SystemSettingFormModal
        open={formOpen}
        setting={editing}
        readOnly={!canWrite}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing ? t("toastUpdated") : t("toastCreated"),
            tone: "success",
          });
          void load();
        }}
      />
    </div>
  );
}
