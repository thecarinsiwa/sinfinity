"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
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
import { cn } from "@/lib/cn";
import type { Country } from "@/lib/settings";

const PAGE_SIZE = 20;
const NEW_HREF = "/parametres/pays/nouveau";

const linkButtonClass = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors",
  "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const linkButtonSmSecondaryClass = cn(
  "inline-flex h-8 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
  "border-border bg-surface text-foreground hover:bg-surface-muted",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

export function CountriesPanel() {
  const t = useTranslations("settings.countries");
  const tc = useTranslations("common");
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
      setError(cause instanceof ApiError ? cause.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, code, search, t]);

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
      toast({ title: t("toastArchived"), tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("isoCode")}</span>
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
              {tc("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="countries-search-label"
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
        </div>
        <Can permission="settings.write">
          <Link href={NEW_HREF} className={linkButtonClass}>
            {t("new")}
          </Link>
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
              <Link
                href={NEW_HREF}
                className={cn(linkButtonClass, "h-8 px-3 text-sm")}
              >
                {t("new")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>{tc("code")}</Th>
                <Th>{t("code3")}</Th>
                <Th>{tc("name")}</Th>
                <Th>{t("phoneCol")}</Th>
                <Th className="text-right">{tc("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((country) => (
                <Tr key={country.id}>
                  <Td className="font-mono text-xs">{country.code}</Td>
                  <Td className="font-mono text-xs text-muted">
                    {country.code3 ?? tc("emDash")}
                  </Td>
                  <Td>{country.name}</Td>
                  <Td className="text-muted">
                    {country.phoneCode ?? tc("emDash")}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="settings.write">
                        <Link
                          href={`/parametres/pays/${country.id}/edit`}
                          className={linkButtonSmSecondaryClass}
                        >
                          {tc("edit")}
                        </Link>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(country)}
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
          {t("archiveBody", {
            name: deleting?.name ?? "",
            code: deleting?.code ?? "",
          })}
        </p>
      </Modal>
    </div>
  );
}
