"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { BRANCH_TYPES, type Branch } from "@/lib/organisation";

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
  const t = useTranslations("organisation");
  const tCommon = useTranslations("common");
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
          : t("branches.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, type, isActive, t]);

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
      toast({ title: t("branches.toastArchived"), tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await load();
      }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium" id="branches-search-label">
              {tCommon("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="branches-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("branches.searchPlaceholder")}
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
                {tCommon("filter")}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tCommon("type")}</span>
            <Select
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value);
              }}
            >
              <option value="">{tCommon("all")}</option>
              {BRANCH_TYPES.map((branchType) => (
                <option key={branchType} value={branchType}>
                  {t(`branchTypes.${branchType}`)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tCommon("status")}</span>
            <Select
              value={isActive}
              onChange={(e) => {
                setPage(1);
                setIsActive(e.target.value);
              }}
            >
              <option value="">{tCommon("all")}</option>
              <option value="true">{tCommon("actives")}</option>
              <option value="false">{tCommon("inactives")}</option>
            </Select>
          </label>
        </div>

        <Can permission="branches.write">
          <Button type="button" onClick={openCreate}>
            {t("branches.new")}
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
          <Spinner label={t("branches.loading")} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t("branches.emptyTitle")}
          description={t("branches.emptyDescription")}
          action={
            canWrite ? (
              <Button type="button" size="sm" onClick={openCreate}>
                {t("branches.new")}
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
                <Th>{tCommon("type")}</Th>
                <Th>{tCommon("phone")}</Th>
                <Th>{tCommon("status")}</Th>
                <Th className="text-right">{tCommon("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((branch) => (
                <Tr key={branch.id}>
                  <Td className="font-mono text-xs">{branch.code}</Td>
                  <Td>{branch.name}</Td>
                  <Td>{t(`branchTypes.${branch.type}`)}</Td>
                  <Td className="text-muted">
                    {branch.phone ?? tCommon("emDash")}
                  </Td>
                  <Td>
                    <Badge tone={branch.isActive ? "success" : "neutral"}>
                      {branch.isActive
                        ? tCommon("active")
                        : tCommon("inactive")}
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
                          {tCommon("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(branch)}
                        >
                          {tCommon("archive")}
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
            title: editing
              ? t("branches.toastUpdated")
              : t("branches.toastCreated"),
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
        title={t("branches.archiveTitle")}
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
              {deleteLoading ? tCommon("archiving") : tCommon("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          {t("branches.archiveBody", {
            name: deleting?.name ?? "",
            code: deleting?.code ?? "",
          })}
        </p>
      </Modal>
    </div>
  );
}
