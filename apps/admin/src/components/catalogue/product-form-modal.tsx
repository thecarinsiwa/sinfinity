"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateProductLiteInput,
  Product,
  ProductBrand,
  ProductCategory,
  ProductUnit,
  UpdateProductLiteInput,
} from "@/lib/catalogue";

type FormState = {
  sku: string;
  name: string;
  brandId: string;
  categoryId: string;
  unitId: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  sku: "",
  name: "",
  brandId: "",
  categoryId: "",
  unitId: "",
  isActive: true,
};

type ProductFormModalProps = {
  open: boolean;
  product: Product | null;
  brands: ProductBrand[];
  categories: ProductCategory[];
  units: ProductUnit[];
  onClose: () => void;
  onSaved: () => void;
};

export function ProductFormModal({
  open,
  product,
  brands,
  categories,
  units,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = product !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            sku: product.sku,
            name: product.name,
            brandId: product.brandId ?? "",
            categoryId: product.categoryId ?? "",
            unitId: product.unitId ?? "",
            isActive: product.isActive,
          }
        : EMPTY,
    );
    setError(null);
  }, [open, product]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateProductLiteInput | UpdateProductLiteInput = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      brandId: form.brandId || null,
      categoryId: form.categoryId || null,
      unitId: form.unitId || null,
      isActive: form.isActive,
    };

    try {
      if (isEdit && product) {
        await apiFetch<Product>(`/products/${product.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<Product>("/products", {
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
      title={isEdit ? "Modifier le produit" : "Nouveau produit"}
      className="max-w-xl"
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
            form="product-lite-form"
            disabled={saving || !form.sku.trim() || !form.name.trim()}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="product-lite-form"
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-2"
      >
        {error ? (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">SKU</span>
          <Input
            required
            maxLength={64}
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            disabled={saving}
            className="uppercase font-mono"
            placeholder="SW-C9300-24T"
          />
        </label>
        <label className="flex items-center gap-2 text-sm self-end pb-2">
          <Checkbox
            checked={form.isActive}
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.checked }))
            }
            disabled={saving}
          />
          <span>Actif</span>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Nom</span>
          <Input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Marque</span>
          <Select
            value={form.brandId}
            onChange={(e) =>
              setForm((f) => ({ ...f, brandId: e.target.value }))
            }
            disabled={saving}
          >
            <option value="">—</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Catégorie</span>
          <Select
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value }))
            }
            disabled={saving}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Unité</span>
          <Select
            value={form.unitId}
            onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
            disabled={saving}
          >
            <option value="">—</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name}
              </option>
            ))}
          </Select>
        </label>
        <p className="text-xs text-muted sm:col-span-2">
          Fiche allégée Admin — specs, images et pricing avancé restent sur
          Web.
        </p>
      </form>
    </Modal>
  );
}
