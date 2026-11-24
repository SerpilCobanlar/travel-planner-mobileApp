import type { TranslationKey } from '@/localization';

/** Currencies offered for plan costs (ISO 4217). Names live in `common.currencies`. */
export const CURRENCY_CODES = ['TRY', 'USD', 'EUR', 'GBP'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** Options for SelectField, e.g. "Türk Lirası (TRY)". */
export function getCurrencyOptions(t: (key: TranslationKey) => string) {
  return CURRENCY_CODES.map((code) => ({
    value: code,
    label: `${t(`common.currencies.${code}` as TranslationKey)} (${code})`,
  }));
}
