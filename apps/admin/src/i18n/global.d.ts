import type { AppLocale } from "./config";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof import("../../messages/fr.json");
  }
}
