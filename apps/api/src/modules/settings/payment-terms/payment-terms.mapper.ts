import { PaymentTermResponseDto } from './dto/payment-term-response.dto';

export type PaymentTermRow = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  days_due: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toPaymentTermResponse(
  row: PaymentTermRow,
): PaymentTermResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    daysDue: row.days_due,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
