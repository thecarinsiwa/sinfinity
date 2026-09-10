"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateShippingTermInput,
  ShippingTerm,
  UpdateShippingTermInput,
} from "@/lib/settings";

type FormState = {
  code: string;
  name: string;
  description: string;
  incotermVersion: string;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  description: "",
  incotermVersion: "2020",
};

type ShippingTermFormModalProps = {
  open: boolean;
  term: ShippingTerm | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ShippingTermFormModal({
  open,
  term,
  onClose,
  onSaved,
}: ShippingTermFormModalProps) {
  const t = useTranslations("settings.shippingTerms");
  const tc = useTranslations("common");
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
            description: term.description ?? "",
            incotermVersion: term.incotermVersion ?? "",
          }
        : EMPTY,
    );
    setError(null);
  }, [open, term]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateShippingTermInput | UpdateShippingTermInput = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      incotermVersion: form.incotermVersion.trim() || null,
    };

    try {
      if (isEdit && term) {
        await apiFetch<ShippingTerm>(`/shipping-terms/${term.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<ShippingTerm>("/shipping-terms", {
          method: "POST",
          body: payload,
        });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : tc("saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("edit") : t("new")}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button
            type="submit"
            form="shipping-term-form"
            disabled={saving || !form.code.trim() || !form.name.trim()}
          >
            {saving ? tc("saving") : isEdit ? tc("save") : tc("create")}
          </Button>
        </>
      }
    >
      <form
        id="shipping-term-form"
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-2"
      >
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formCode")}</span>
          <Input
            required
            maxLength={32}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={saving}
            placeholder="FOB"
            className="uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("formVersion")}</span>
          <Input
            maxLength={32}
            value={form.incotermVersion}
            onChange={(e) =>
              setForm((f) => ({ ...f, incotermVersion: e.target.value }))
            }
            disabled={saving}
            placeholder="2020"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">{t("formName")}</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="Free On Board"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">
            {tc("optional", { label: t("formDescription") })}
          </span>
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
