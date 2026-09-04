import { CityResponseDto } from './dto/city-response.dto';

export type CityRow = {
  id: string;
  country_id: string;
  name: string;
  region: string | null;
  created_at: string;
  updated_at: string;
};

export function toCityResponse(row: CityRow): CityResponseDto {
  return {
    id: row.id,
    countryId: row.country_id,
    name: row.name,
    region: row.region,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
