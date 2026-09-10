/** Types alignés sur les DTO Settings de l’API Nest (camelCase). */

export type Country = {
  id: string;
  code: string;
  code3: string | null;
  name: string;
  phoneCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCountryInput = {
  code: string;
  name: string;
  code3?: string;
  phoneCode?: string;
};

export type UpdateCountryInput = Partial<CreateCountryInput>;

export type City = {
  id: string;
  countryId: string;
  name: string;
  region: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCityInput = {
  countryId: string;
  name: string;
  region?: string | null;
};

export type UpdateCityInput = Partial<CreateCityInput>;

export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCurrencyInput = {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces?: number;
  isActive?: boolean;
};

export type UpdateCurrencyInput = Partial<CreateCurrencyInput>;

export type ExchangeRate = {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  /** Decimal string — never float. */
  rate: string;
  rateDate: string;
  source: string | null;
  createdAt: string;
};

export type CreateExchangeRateInput = {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: string;
  rateDate: string;
  source?: string;
};

export type UpdateExchangeRateInput = Partial<CreateExchangeRateInput>;

export const TAX_TYPES = ["vat", "customs", "withholding", "other"] as const;
export type TaxType = (typeof TAX_TYPES)[number];

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  vat: "TVA",
  customs: "Douane",
  withholding: "Retenue",
  other: "Autre",
};

export type Tax = {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  /** Decimal string — never float. */
  rate: string;
  taxType: TaxType;
  countryId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaxInput = {
  organizationId?: string | null;
  code: string;
  name: string;
  rate: string;
  taxType: TaxType;
  countryId?: string | null;
  isActive?: boolean;
};

export type UpdateTaxInput = Partial<CreateTaxInput>;

export const UNIT_TYPES = [
  "count",
  "weight",
  "length",
  "volume",
  "other",
] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  count: "Comptage",
  weight: "Poids",
  length: "Longueur",
  volume: "Volume",
  other: "Autre",
};

export type Unit = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  unitType: UnitType;
  createdAt: string;
  updatedAt: string;
};

export type CreateUnitInput = {
  code: string;
  name: string;
  symbol?: string | null;
  unitType?: UnitType;
};

export type UpdateUnitInput = Partial<CreateUnitInput>;

export type PaymentTerm = {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  daysDue: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentTermInput = {
  organizationId?: string | null;
  code: string;
  name: string;
  daysDue?: number;
  description?: string | null;
};

export type UpdatePaymentTermInput = Partial<CreatePaymentTermInput>;

export type ShippingTerm = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  incotermVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateShippingTermInput = {
  code: string;
  name: string;
  description?: string | null;
  incotermVersion?: string | null;
};

export type UpdateShippingTermInput = Partial<CreateShippingTermInput>;

export type SettingsSeedBucket = {
  inserted: number;
  updated: number;
};

export type SettingsSeedResult = {
  inserted: number;
  updated: number;
  details: {
    currencies: SettingsSeedBucket;
    countries: SettingsSeedBucket;
    cities: SettingsSeedBucket;
    units: SettingsSeedBucket;
    shippingTerms: SettingsSeedBucket;
    paymentTerms: SettingsSeedBucket;
    taxes: SettingsSeedBucket;
  };
};

export type SettingsNavItem = {
  title: string;
  description: string;
  href: string;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    title: "Pays",
    description: "Référentiel géographique ISO",
    href: "/parametres/pays",
  },
  {
    title: "Villes",
    description: "Villes rattachées aux pays",
    href: "/parametres/villes",
  },
  {
    title: "Devises",
    description: "USD, CDF, CNY…",
    href: "/parametres/devises",
  },
  {
    title: "Taux de change",
    description: "Historique et dernier taux",
    href: "/parametres/taux-change",
  },
  {
    title: "Taxes",
    description: "TVA, douane, retenues",
    href: "/parametres/taxes",
  },
  {
    title: "Unités",
    description: "PCS, KG, BOX…",
    href: "/parametres/unites",
  },
  {
    title: "Conditions de paiement",
    description: "NET30, acompte…",
    href: "/parametres/conditions-paiement",
  },
  {
    title: "Incoterms",
    description: "EXW, FOB, CIF, DDP…",
    href: "/parametres/incoterms",
  },
];
