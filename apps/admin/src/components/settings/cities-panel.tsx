"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { CityFormModal } from "@/components/settings/city-form-modal";
import {
  Alert,
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
import type { City, Country } from "@/lib/settings";

const PAGE_SIZE = 20;

export function CitiesPanel() {
  const t = useTranslations("settings.cities");
  const tc = useTranslations("common");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("settings.write");

  const [page, setPage] = useState(1);
  const [countryId, setCountryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<City[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [deleting, setDeleting] = useState<City | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const countryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries) {
      map.set(c.id, `${c.code} — ${c.name}`);
    }
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
      if (countryId) {
        query.set("countryId", countryId);
      }
      if (search.trim()) {
        query.set("search", search.trim());
      }
      const result = await apiFetch<PaginatedResponse<City>>(
        `/cities?${query.toString()}`,
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
  }, [page, countryId, search, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/cities/${deleting.id}`, { method: "DELETE" });
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
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
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
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium" id="cities-search-label">
              {tc("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="cities-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
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
                <Th>{tc("name")}</Th>
                <Th>{t("country")}</Th>
                <Th>{tc("region")}</Th>
                <Th className="text-right">{tc("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((city) => (
                <Tr key={city.id}>
                  <Td>{city.name}</Td>
                  <Td className="text-sm text-muted">
                    {countryNameById.get(city.countryId) ?? city.countryId}
                  </Td>
                  <Td className="text-muted">{city.region ?? tc("emDash")}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="settings.write">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(city);
                            setFormOpen(true);
                          }}
                        >
                          {tc("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(city)}
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

      <CityFormModal
        open={formOpen}
        city={editing}
        countries={countries}
        defaultCountryId={countryId}
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
          {t("archiveBody", { name: deleting?.name ?? "" })}
        </p>
      </Modal>
    </div>
  );
}
