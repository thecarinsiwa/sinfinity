"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { TaxFormModal } from "@/components/settings/tax-form-modal";
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
  formatDecimalDisplay,
  TAX_TYPES,
  type Country,
  type Tax,
  type TaxType,
} from "@/lib/settings";

const PAGE_SIZE = 20;

export function TaxesPanel() {
  const t = useTranslations("settings.taxes");
  const tc = useTranslations("common");
  const tTaxTypes = useTranslations("settings.taxTypes");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [taxType, setTaxType] = useState("");
  const [countryId, setCountryId] = useState("");
  const [isActive, setIsActive] = useState("");

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Tax[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tax | null>(null);
  const [deleting, setDeleting] = useState<Tax | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const countryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries) map.set(c.id, c.code);
    return map;
  }, [countries]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiFetch<PaginatedResponse<Country>>(
          "/countries?page=1&pageSize=100",
        );
        if (!cancelled) setCountries(result.data);
      } catch {
        if (!cancelled) setCountries([]);
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
      if (taxType) query.set("taxType", taxType);
      if (countryId) query.set("countryId", countryId);
      if (isActive === "true" || isActive === "false") {
        query.set("isActive", isActive);
      }
      const result = await apiFetch<PaginatedResponse<Tax>>(
        `/taxes?${query.toString()}`,
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
  }, [page, search, taxType, countryId, isActive, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/taxes/${deleting.id}`, { method: "DELETE" });
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

  function taxTypeLabel(type: string) {
    return TAX_TYPES.includes(type as TaxType)
      ? tTaxTypes(type as TaxType)
      : type;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
            <span className="font-medium" id="taxes-search-label">
              {tc("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="taxes-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setSearch(searchInput);
                  }
                }}
                placeholder={t("searchPlaceholder")}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPage(1);
                  setSearch(searchInput);
                }}
              >
                {tc("filter")}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tc("type")}</span>
            <Select
              value={taxType}
              onChange={(e) => {
                setPage(1);
                setTaxType(e.target.value);
              }}
            >
              <option value="">{tc("all")}</option>
              {TAX_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tTaxTypes(type)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("country")}</span>
            <Select
              value={countryId}
              onChange={(e) => {
                setPage(1);
                setCountryId(e.target.value);
              }}
            >
              <option value="">{tc("all")}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tc("status")}</span>
            <Select
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
                <Th>{t("rate")}</Th>
                <Th>{tc("type")}</Th>
                <Th>{t("country")}</Th>
                <Th>{tc("status")}</Th>
                <Th className="text-right">{tc("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.code}</Td>
                  <Td>{row.name}</Td>
                  <Td className="font-mono text-sm">
                    {formatDecimalDisplay(row.rate)}
                  </Td>
                  <Td>{taxTypeLabel(row.taxType)}</Td>
                  <Td className="text-muted">
                    {row.countryId
                      ? (countryLabelById.get(row.countryId) ?? tc("emDash"))
                      : "Global"}
                  </Td>
                  <Td>
                    <Badge tone={row.isActive ? "success" : "neutral"}>
                      {row.isActive ? tc("active") : tc("inactive")}
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

      <TaxFormModal
        open={formOpen}
        tax={editing}
        countries={countries}
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
