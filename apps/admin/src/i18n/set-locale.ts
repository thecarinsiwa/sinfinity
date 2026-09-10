"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type AppLocale,
} from "@/i18n/config";

export async function setLocaleAction(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) {
    return;
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
