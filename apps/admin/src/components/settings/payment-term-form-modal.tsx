"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreatePaymentTermInput,
  PaymentTerm,
  UpdatePaymentTermInput,
} from "@/lib/settings";

type FormState = {
  code: string;
  name: string;
  daysDue: string;
  description: string;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  daysDue: "0",
  description: "",
};

type PaymentTermFormModalProps = {
  open: boolean;
  term: PaymentTerm | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PaymentTermFormModal({
  open,
  term,
  onClose,
  onSaved,
}: PaymentTermFormModalProps) {
  const isEdit = term !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      term
        ? {
            code: term.code,
            name: term.name,
            daysDue: String(term.daysDue),
            description: term.description ?? "",
          }
        : EMPTY,
    );
    setError(null);
  }, [open, term]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const days = Number.parseInt(form.daysDue, 10);
    if (Number.isNaN(days) || days < 0) {
      setError("Le délai doit être un entier ≥ 0");
      setSaving(false);
      return;
    }

    const payload: CreatePaymentTermInput | UpdatePaymentTermInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      daysDue: days,
      description: form.description.trim() || null,
    };

    try {
      if (isEdit && term) {
        await apiFetch<PaymentTerm>(`/payment-terms/${term.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<PaymentTerm>("/payment-terms", {
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
      title={isEdit ? "Modifier la condition" : "Nouvelle condition"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="payment-term-form"
            disabled={saving || !form.code.trim() || !form.name.trim()}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="payment-term-form"
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-2"
      >
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Code</span>
          <Input
            required
            maxLength={64}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving}
            placeholder="NET30"
            className="uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Délai (jours)</span>
          <Input
            required
            type="number"
            min={0}
            value={form.daysDue}
            onChange={(e) => setForm((f) => ({ ...f, daysDue: e.target.value }))}
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Libellé</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="Net 30 jours"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Description (optionnel)</span>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            disabled={saving}
          />
        </label>
      </form>
    </Modal>
  );
}
