"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateProductBrandInput,
  ProductBrand,
  UpdateProductBrandInput,
} from "@/lib/catalogue";

type FormState = {
  name: string;
  logoUrl: string;
  website: string;
};

const EMPTY: FormState = { name: "", logoUrl: "", website: "" };

type BrandFormModalProps = {
  open: boolean;
  brand: ProductBrand | null;
  onClose: () => void;
  onSaved: () => void;
};

export function BrandFormModal({
  open,
  brand,
  onClose,
  onSaved,
}: BrandFormModalProps) {
  const isEdit = brand !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      brand
        ? {
            name: brand.name,
            logoUrl: brand.logoUrl ?? "",
            website: brand.website ?? "",
          }
        : EMPTY,
    );
    setError(null);
  }, [open, brand]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateProductBrandInput | UpdateProductBrandInput = {
      name: form.name.trim(),
      logoUrl: form.logoUrl.trim() || null,
      website: form.website.trim() || null,
    };

    try {
      if (isEdit && brand) {
        await apiFetch<ProductBrand>(`/product-brands/${brand.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<ProductBrand>("/product-brands", {
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
      title={isEdit ? "Modifier la marque" : "Nouvelle marque"}
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="brand-form"
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="brand-form" onSubmit={onSubmit} className="flex flex-col gap-3">
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nom</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="Cisco"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Logo URL (optionnel)</span>
          <Input
            maxLength={512}
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            disabled={saving}
            placeholder="https://…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Site web (optionnel)</span>
          <Input
            maxLength={255}
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            disabled={saving}
            placeholder="https://www.cisco.com"
          />
        </label>
      </form>
    </Modal>
  );
}
