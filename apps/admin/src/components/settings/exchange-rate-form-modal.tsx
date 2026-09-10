"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import {
  isDecimalString,
  type CreateExchangeRateInput,
  type Currency,
  type ExchangeRate,
  type UpdateExchangeRateInput,
} from "@/lib/settings";

type FormState = {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: string;
  rateDate: string;
  source: string;
};

type ExchangeRateFormModalProps = {
  open: boolean;
  rate: ExchangeRate | null;
  currencies: Currency[];
  onClose: () => void;
  onSaved: () => void;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExchangeRateFormModal({
  open,
  rate,
  currencies,
  onClose,
  onSaved,
}: ExchangeRateFormModalProps) {
  const isEdit = rate !== null;
  const [form, setForm] = useState<FormState>({
    fromCurrencyId: "",
    toCurrencyId: "",
    rate: "",
    rateDate: todayIsoDate(),
    source: "manual",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      rate
        ? {
            fromCurrencyId: rate.fromCurrencyId,
            toCurrencyId: rate.toCurrencyId,
            rate: rate.rate,
            rateDate: rate.rateDate.slice(0, 10),
            source: rate.source ?? "manual",
          }
        : {
            fromCurrencyId: "",
            toCurrencyId: "",
            rate: "",
            rateDate: todayIsoDate(),
            source: "manual",
          },
    );
    setError(null);
  }, [open, rate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const rateValue = form.rate.trim();
    if (!isDecimalString(rateValue)) {
      setError("Le taux doit être un nombre décimal (string), ex. 2850.50000000");
      setSaving(false);
      return;
    }

    const payload: CreateExchangeRateInput | UpdateExchangeRateInput = {
      fromCurrencyId: form.fromCurrencyId,
      toCurrencyId: form.toCurrencyId,
      rate: rateValue,
      rateDate: form.rateDate,
      source: form.source.trim() || undefined,
    };

    try {
      if (isEdit && rate) {
        await apiFetch<ExchangeRate>(`/exchange-rates/${rate.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<ExchangeRate>("/exchange-rates", {
          method: "POST",
          body: payload,
        });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Enregistrement impossible",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le taux" : "Nouveau taux"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="exchange-rate-form"
            disabled={
              saving ||
              !form.fromCurrencyId ||
              !form.toCurrencyId ||
              !form.rate.trim() ||
              !form.rateDate
            }
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="exchange-rate-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Devise source</span>
          <Select
            required
            value={form.fromCurrencyId}
            onChange={(e) =>
              setForm((f) => ({ ...f, fromCurrencyId: e.target.value }))
            }
            disabled={saving}
          >
            <option value="">—</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Devise cible</span>
          <Select
            required
            value={form.toCurrencyId}
            onChange={(e) =>
              setForm((f) => ({ ...f, toCurrencyId: e.target.value }))
            }
            disabled={saving}
          >
            <option value="">—</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Taux (decimal string)</span>
          <Input
            required
            inputMode="decimal"
            value={form.rate}
            onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            disabled={saving}
            placeholder="2850.50000000"
            className="font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Date</span>
          <Input
            required
            type="date"
            value={form.rateDate}
            onChange={(e) => setForm((f) => ({ ...f, rateDate: e.target.value }))}
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Source</span>
          <Input
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            disabled={saving}
            placeholder="manual"
          />
        </label>
      </form>
    </Modal>
  );
}
