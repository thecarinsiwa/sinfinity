import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';

export type ExchangeRateRow = {
  id: string;
  from_currency_id: string;
  to_currency_id: string;
  rate: string;
  rate_date: string;
  source: string | null;
  created_at: string;
};

export function toExchangeRateResponse(
  row: ExchangeRateRow,
): ExchangeRateResponseDto {
  return {
    id: row.id,
    fromCurrencyId: row.from_currency_id,
    toCurrencyId: row.to_currency_id,
    rate: row.rate,
    rateDate: row.rate_date,
    source: row.source,
    createdAt: row.created_at,
  };
}
