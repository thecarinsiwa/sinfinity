"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError, apiFetch, type PaginatedResponse } from "@/lib/api";
import {
  BRANCH_TYPE_LABELS,
  BRANCH_TYPES,
  type Branch,
  type BranchType,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "@/lib/organisation";

type CityOption = { id: string; name: string; countryId: string };
type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type FormState = {
  code: string;
  name: string;
  type: BranchType;
  address: string;
  cityId: string;
  phone: string;
  managerUserId: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  type: "office",
  address: "",
  cityId: "",
  phone: "",
  managerUserId: "",
  isActive: true,
};

function toFormState(branch: Branch): FormState {
  return {
    code: branch.code,
    name: branch.name,
    type: branch.type,
    address: branch.address ?? "",
    cityId: branch.cityId ?? "",
    phone: branch.phone ?? "",
    managerUserId: branch.managerUserId ?? "",
    isActive: branch.isActive,
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

type BranchFormModalProps = {
  open: boolean;
  branch: Branch | null;
  onClose: () => void;
  onSaved: () => void;
};

export function BranchFormModal({
  open,
  branch,
  onClose,
  onSaved,
}: BranchFormModalProps) {
  const { hasPermission } = useAuth();
  const canReadSettings = hasPermission("settings.read");
  const canReadUsers = hasPermission("users.read");
  const isEdit = branch !== null;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [citiesStub, setCitiesStub] = useState(false);
  const [usersStub, setUsersStub] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(branch ? toFormState(branch) : EMPTY_FORM);
    setError(null);
  }, [open, branch]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    (async () => {
      if (canReadSettings) {
        try {
          const page = await apiFetch<PaginatedResponse<CityOption>>(
            "/cities?page=1&pageSize=100",
          );
          if (!cancelled) {
            setCities(page.data);
            setCitiesStub(false);
          }
        } catch {
          if (!cancelled) {
            setCities([]);
            setCitiesStub(true);
          }
        }
      } else if (!cancelled) {
        setCitiesStub(true);
      }

      if (canReadUsers) {
        try {
          const page = await apiFetch<PaginatedResponse<UserOption>>(
            "/users?page=1&pageSize=100&isActive=true",
          );
          if (!cancelled) {
            setUsers(page.data);
            setUsersStub(false);
          }
        } catch {
          if (!cancelled) {
            setUsers([]);
            setUsersStub(true);
          }
        }
      } else if (!cancelled) {
        setUsersStub(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, canReadSettings, canReadUsers]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CreateBranchInput | UpdateBranchInput = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      address: emptyToNull(form.address),
      cityId: emptyToNull(form.cityId),
      phone: emptyToNull(form.phone),
      managerUserId: emptyToNull(form.managerUserId),
      isActive: form.isActive,
    };

    try {
      if (isEdit && branch) {
        await apiFetch<Branch>(`/branches/${branch.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiFetch<Branch>("/branches", {
          method: "POST",
          body: payload,
        });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Impossible d’enregistrer l’agence",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier l’agence" : "Nouvelle agence"}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="branch-form"
            disabled={saving || !form.code.trim() || !form.name.trim()}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="branch-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Code</span>
            <Input
              required
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
              disabled={saving}
              placeholder="HQ-KIN"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Type</span>
            <Select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value as BranchType)}
              disabled={saving}
            >
              {BRANCH_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BRANCH_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Nom</span>
            <Input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={saving}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Adresse</span>
            <Textarea
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={saving}
              rows={2}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ville</span>
            {!citiesStub && cities.length > 0 ? (
              <Select
                value={form.cityId}
                onChange={(e) => updateField("cityId", e.target.value)}
                disabled={saving}
              >
                <option value="">— Aucune —</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.cityId}
                onChange={(e) => updateField("cityId", e.target.value)}
                disabled={saving}
                placeholder="UUID ville"
                className="font-mono text-xs"
              />
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Téléphone</span>
            <Input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={saving}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Responsable</span>
            {!usersStub && users.length > 0 ? (
              <Select
                value={form.managerUserId}
                onChange={(e) => updateField("managerUserId", e.target.value)}
                disabled={saving}
              >
                <option value="">— Aucun —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.managerUserId}
                onChange={(e) => updateField("managerUserId", e.target.value)}
                disabled={saving}
                placeholder="UUID utilisateur"
                className="font-mono text-xs"
              />
            )}
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              disabled={saving}
            />
            <span>Agence active</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
