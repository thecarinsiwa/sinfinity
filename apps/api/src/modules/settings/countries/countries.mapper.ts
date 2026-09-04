import { CountryResponseDto } from './dto/country-response.dto';

export type CountryRow = {
  id: string;
  code: string;
  code3: string | null;
  name: string;
  phone_code: string | null;
  created_at: string;
  updated_at: string;
};

export function toCountryResponse(row: CountryRow): CountryResponseDto {
  return {
    id: row.id,
    code: row.code,
    code3: row.code3,
    name: row.name,
    phoneCode: row.phone_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
