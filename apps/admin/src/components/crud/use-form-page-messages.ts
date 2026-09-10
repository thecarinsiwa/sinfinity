"use client";

import { useTranslations } from "next-intl";

/**
 * Messages du chrome pages formulaire (`common.formPage` + actions `common.*`).
 * `cancel` / `save` / `saving` / `loading` réutilisent `common` (mêmes libellés que formPage.cancel/save).
 */
export function useFormPageMessages() {
  const t = useTranslations("common.formPage");
  const tc = useTranslations("common");

  return {
    breadcrumb: t("breadcrumb"),
    createTitle: (resource: string) => t("createTitle", { resource }),
    editTitle: (resource: string) => t("editTitle", { resource }),
    createCrumb: t("createCrumb"),
    editCrumb: t("editCrumb"),
    cancel: tc("cancel"),
    save: tc("save"),
    saving: tc("saving"),
    loading: tc("loading"),
    saveSuccess: t("saveSuccess"),
    loadFailed: t("loadFailed"),
    notFound: t("notFound"),
  };
}
