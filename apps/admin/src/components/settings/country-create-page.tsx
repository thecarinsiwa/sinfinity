"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { FormPageShell, useFormPageMessages } from "@/components/crud";
import { CountryForm } from "@/components/settings/country-form";
import { useToast } from "@/components/ui/toast";
import type { Country } from "@/lib/settings";

const FORM_ID = "country-form";
const LIST_HREF = "/parametres/pays";

export function CountryCreatePage() {
  const t = useTranslations("settings.countries");
  const ts = useTranslations("settings");
  const fp = useFormPageMessages();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("settings.write");
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const onSuccess = useCallback(
    (_saved: Country) => {
      toast({ title: t("toastCreated"), tone: "success" });
      router.push(LIST_HREF);
    },
    [router, t, toast],
  );

  return (
    <FormPageShell
      title={fp.createTitle(t("pageTitle"))}
      description={t("pageLead")}
      breadcrumbs={[
        { label: ts("hubTitle"), href: "/parametres" },
        { label: t("pageTitle"), href: LIST_HREF },
        { label: fp.createCrumb },
      ]}
      formId={FORM_ID}
      cancelHref={LIST_HREF}
      saving={saving}
      saveDisabled={!canWrite || !canSubmit}
    >
      <CountryForm
        formId={FORM_ID}
        country={null}
        onSuccess={onSuccess}
        onSavingChange={setSaving}
        onCanSubmitChange={setCanSubmit}
        disabled={!canWrite}
      />
    </FormPageShell>
  );
}
