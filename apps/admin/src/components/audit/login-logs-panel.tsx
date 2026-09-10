"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import type { LoginLog } from "@/lib/ops";

const PAGE_SIZE = 20;

export function LoginLogsPanel() {
  const t = useTranslations("audit.loginLogs");
  const tCommon = useTranslations("common");

  const [page, setPage] = useState(1);
  const [emailInput, setEmailInput] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (email.trim()) query.set("email", email.trim());
      if (success === "true" || success === "false") {
        query.set("success", success);
      }
      if (dateFrom) query.set("dateFrom", dateFrom);
      if (dateTo) query.set("dateTo", dateTo);
      const result = await apiFetch<PaginatedResponse<LoginLog>>(
        `/login-logs?${query.toString()}`,
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
  }, [page, email, success, dateFrom, dateTo, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setEmail(emailInput);
    setDateFrom(dateFromInput);
    setDateTo(dateToInput);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("email")}</span>
          <Input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={t("emailPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("status")}</span>
          <Select
            value={success}
            onChange={(e) => {
              setPage(1);
              setSuccess(e.target.value);
            }}
          >
            <option value="">{tCommon("all")}</option>
            <option value="true">{tCommon("success")}</option>
            <option value="false">{tCommon("failure")}</option>
          </Select>
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
          <span className="font-medium" id="login-logs-date-to-label">
            {tCommon("to")}
          </span>
          <div className="flex gap-2">
            <Input
              aria-labelledby="login-logs-date-to-label"
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
                <Th>{t("status")}</Th>
                <Th>{t("email")}</Th>
                <Th>{t("ip")}</Th>
                <Th>{t("userAgent")}</Th>
                <Th>{tCommon("error")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {row.createdAt.slice(0, 19).replace("T", " ")}
                  </Td>
                  <Td>
                    <Badge tone={row.success ? "success" : "danger"}>
                      {row.success
                        ? tCommon("success")
                        : tCommon("failure")}
                    </Badge>
                  </Td>
                  <Td className="text-sm">
                    {row.emailAttempted ?? tCommon("emDash")}
                  </Td>
                  <Td className="font-mono text-xs">
                    {row.ipAddress ?? tCommon("emDash")}
                  </Td>
                  <Td
                    className="max-w-[14rem] truncate text-xs text-muted"
                    title={row.userAgent ?? undefined}
                  >
                    {row.userAgent ?? tCommon("emDash")}
                  </Td>
                  <Td className="text-xs text-muted">
                    {row.success
                      ? tCommon("emDash")
                      : (row.failureReason ?? tCommon("emDash"))}
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
    </div>
  );
}
