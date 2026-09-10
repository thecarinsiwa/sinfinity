/**
 * Idempotent reference data for Phase 1 (feat/api-m18-seeds).
 * Upsert keys: currency/country/unit/shipping_term codes;
 * cities (country code + name + region); global payment_terms / taxes by code.
 */

export type CurrencySeedDef = {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
};

export type CountrySeedDef = {
  code: string;
  code3: string;
  name: string;
  phoneCode: string;
};

export type CitySeedDef = {
  countryCode: string;
  name: string;
  region: string;
};

export type UnitSeedDef = {
  code: string;
  name: string;
  symbol: string;
  unitType: 'count' | 'weight' | 'length' | 'volume' | 'other';
};

export type ShippingTermSeedDef = {
  code: string;
  name: string;
  description: string;
  incotermVersion: string;
};

export type PaymentTermSeedDef = {
  code: string;
  name: string;
  daysDue: number;
  description: string;
};

export type TaxSeedDef = {
  code: string;
  name: string;
  rate: string;
  taxType: 'vat' | 'customs' | 'withholding' | 'other';
  countryCode: string;
};

export const SEED_CURRENCIES: CurrencySeedDef[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', decimalPlaces: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
];

export const SEED_COUNTRIES: CountrySeedDef[] = [
  { code: 'CD', code3: 'COD', name: 'Congo, Democratic Republic of the', phoneCode: '+243' },
  { code: 'CN', code3: 'CHN', name: 'China', phoneCode: '+86' },
  { code: 'AE', code3: 'ARE', name: 'United Arab Emirates', phoneCode: '+971' },
  { code: 'FR', code3: 'FRA', name: 'France', phoneCode: '+33' },
  { code: 'BE', code3: 'BEL', name: 'Belgium', phoneCode: '+32' },
];

export const SEED_CITIES: CitySeedDef[] = [
  { countryCode: 'CD', name: 'Kinshasa', region: 'Kinshasa' },
  { countryCode: 'CD', name: 'Lubumbashi', region: 'Haut-Katanga' },
  { countryCode: 'CN', name: 'Shenzhen', region: 'Guangdong' },
  { countryCode: 'AE', name: 'Dubai', region: 'Dubai' },
];

export const SEED_UNITS: UnitSeedDef[] = [
  { code: 'PCS', name: 'Piece', symbol: 'pcs', unitType: 'count' },
  { code: 'KG', name: 'Kilogram', symbol: 'kg', unitType: 'weight' },
  { code: 'BOX', name: 'Box', symbol: 'box', unitType: 'count' },
  { code: 'M', name: 'Meter', symbol: 'm', unitType: 'length' },
];

export const SEED_SHIPPING_TERMS: ShippingTermSeedDef[] = [
  {
    code: 'EXW',
    name: 'Ex Works',
    description: 'Seller makes goods available at their premises.',
    incotermVersion: '2020',
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    description: 'Seller delivers goods on board the vessel nominated by the buyer.',
    incotermVersion: '2020',
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    description: 'Seller pays cost, insurance and freight to the named port of destination.',
    incotermVersion: '2020',
  },
  {
    code: 'DDU',
    name: 'Delivered Duty Unpaid',
    description: 'Seller delivers without clearing import duties (pre-Incoterms 2020 usage).',
    incotermVersion: '2020',
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    description: 'Seller delivers cleared for import, duties paid.',
    incotermVersion: '2020',
  },
];

export const SEED_PAYMENT_TERMS: PaymentTermSeedDef[] = [
  {
    code: 'NET30',
    name: 'Net 30',
    daysDue: 30,
    description: 'Payment due within 30 days',
  },
  {
    code: 'NET60',
    name: 'Net 60',
    daysDue: 60,
    description: 'Payment due within 60 days',
  },
  {
    code: 'COD',
    name: 'Cash on Delivery',
    daysDue: 0,
    description: 'Payment upon delivery',
  },
];

export const SEED_TAXES: TaxSeedDef[] = [
  {
    code: 'TVA_CD',
    name: 'TVA RDC 16%',
    rate: '16.0000',
    taxType: 'vat',
    countryCode: 'CD',
  },
];
