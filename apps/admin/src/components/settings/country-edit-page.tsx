"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { FormPageShell, useFormPageMessages } from "@/components/crud";
import { CountryForm } from "@/components/settings/country-form";
import { useToast } from "@/components/ui/toast";
import { ApiError, apiFetch } from "@/lib/api";
import type { Country } from "@/lib/settings";

const FORM_ID = "country-form";
const LIST_HREF = "/parametres/pays";

export function CountryEditPage({ countryId }: { countryId: string }) {
  const t = useTranslations("settings.countries");
  const ts = useTranslations("settings");
  const tForm = useTranslations("common.formPage");
  const fp = useFormPageMessages();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("settings.write");
  const router = useRouter();
  const { toast } = useToast();

  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await apiFetch<Country>(`/countries/${countryId}`);
        if (!cancelled) {
          setCountry(data);
        }
      } catch (cause) {
        if (!cancelled) {
          setCountry(null);
          if (cause instanceof ApiError && cause.statusCode === 404) {
            setLoadError(tForm("notFound"));
          } else {
            setLoadError(
              cause instanceof ApiError ? cause.message : tForm("loadFailed"),
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [countryId, tForm]);

  const onSuccess = useCallback(
    (_saved: Country) => {
      toast({ title: t("toastUpdated"), tone: "success" });
      router.push(LIST_HREF);
    },
    [router, t, toast],
  );

  return (
    <FormPageShell
      title={fp.editTitle(t("pageTitle"))}
      description={t("pageLead")}
      breadcrumbs={[
        { label: ts("hubTitle"), href: "/parametres" },
        { label: t("pageTitle"), href: LIST_HREF },
        { label: fp.editCrumb },
      ]}
      formId={FORM_ID}
      cancelHref={LIST_HREF}
      loading={loading}
      error={loadError}
      saving={saving}
      saveDisabled={!canWrite || !canSubmit}
    >
      {country ? (
        <CountryForm
          formId={FORM_ID}
          country={country}
          onSuccess={onSuccess}
          onSavingChange={setSaving}
          onCanSubmitChange={setCanSubmit}
          disabled={!canWrite}
        />
      ) : null}
    </FormPageShell>
  );
}
