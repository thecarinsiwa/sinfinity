"use client";

import { useCallback, useEffect, useState } from "react";
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
        cause instanceof ApiError
          ? cause.message
          : "Impossible de charger les journaux de connexion",
      );
    } finally {
      setLoading(false);
    }
  }, [page, email, success, dateFrom, dateTo]);

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
          <span className="font-medium">Email</span>
          <Input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="admin@"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Statut</span>
          <Select
            value={success}
            onChange={(e) => {
              setPage(1);
              setSuccess(e.target.value);
            }}
          >
            <option value="">Tous</option>
            <option value="true">Succès</option>
            <option value="false">Échec</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Du</span>
          <Input
            type="date"
            value={dateFromInput}
            onChange={(e) => setDateFromInput(e.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium" id="login-logs-date-to-label">
            Au
          </span>
          <div className="flex gap-2">
            <Input
              aria-labelledby="login-logs-date-to-label"
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={applyFilters}>
              Filtrer
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des connexions…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune connexion"
          description="Aucun essai de connexion ne correspond aux filtres."
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Email</Th>
                <Th>IP</Th>
                <Th>User-Agent</Th>
                <Th>Raison</Th>
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
                      {row.success ? "Succès" : "Échec"}
                    </Badge>
                  </Td>
                  <Td className="text-sm">{row.emailAttempted ?? "—"}</Td>
                  <Td className="font-mono text-xs">{row.ipAddress ?? "—"}</Td>
                  <Td
                    className="max-w-[14rem] truncate text-xs text-muted"
                    title={row.userAgent ?? undefined}
                  >
                    {row.userAgent ?? "—"}
                  </Td>
                  <Td className="text-xs text-muted">
                    {row.success ? "—" : (row.failureReason ?? "—")}
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
