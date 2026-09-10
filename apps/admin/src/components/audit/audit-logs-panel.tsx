"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AuditLogDetailDrawer } from "@/components/audit/audit-log-detail-drawer";
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
import { ApiError, apiFetch, type PaginatedResponse } from "@/lib/api";
import type { AuditLog } from "@/lib/ops";

const PAGE_SIZE = 20;

export function AuditLogsPanel() {
  const t = useTranslations("audit.logs");
  const tCommon = useTranslations("common");

  const [page, setPage] = useState(1);
  const [actionInput, setActionInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [entityIdInput, setEntityIdInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (action.trim()) query.set("action", action.trim());
      if (entityType.trim()) query.set("entityType", entityType.trim());
      if (entityId.trim()) query.set("entityId", entityId.trim());
      if (userId.trim()) query.set("userId", userId.trim());
      if (dateFrom) query.set("dateFrom", dateFrom);
      if (dateTo) query.set("dateTo", dateTo);
      const result = await apiFetch<PaginatedResponse<AuditLog>>(
        `/audit-logs?${query.toString()}`,
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
  }, [page, action, entityType, entityId, userId, dateFrom, dateTo, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setAction(actionInput);
    setEntityType(entityTypeInput);
    setEntityId(entityIdInput);
    setUserId(userIdInput);
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("action")}</span>
          <Input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            placeholder="create, update…"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("entityType")}</span>
          <Input
            value={entityTypeInput}
            onChange={(e) => setEntityTypeInput(e.target.value)}
            placeholder="users"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("entityId")}</span>
          <Input
            value={entityIdInput}
            onChange={(e) => setEntityIdInput(e.target.value)}
            placeholder="UUID"
            className="font-mono"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("userId")}</span>
          <Input
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="UUID"
            className="font-mono"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{tCommon("from")}</span>
          <Input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium" id="audit-logs-date-to-label">
            {tCommon("to")}
          </span>
          <div className="flex gap-2">
            <Input
              aria-labelledby="audit-logs-date-to-label"
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
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
                <Th>{t("actor")}</Th>
                <Th>{t("action")}</Th>
                <Th>{t("entityType")}</Th>
                <Th>{t("entityId")}</Th>
                <Th className="text-right">{tCommon("detail")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {row.createdAt.slice(0, 19).replace("T", " ")}
                  </Td>
                  <Td
                    className="max-w-[8rem] truncate font-mono text-xs"
                    title={row.userId ?? undefined}
                  >
                    {row.userId ?? tCommon("emDash")}
                  </Td>
                  <Td>{row.action}</Td>
                  <Td className="font-mono text-xs">{row.entityType}</Td>
                  <Td
                    className="max-w-[10rem] truncate font-mono text-xs text-muted"
                    title={row.entityId ?? undefined}
                  >
                    {row.entityId ?? tCommon("emDash")}
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

      <AuditLogDetailDrawer
        open={selected !== null}
        log={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
