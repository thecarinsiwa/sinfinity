import { toBool } from '../../settings/utils/mysql-datetime';
import type { PaymentMethodResponseDto } from './dto/payment-method.dto';

export type PaymentMethodRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function toPaymentMethodResponse(
  row: PaymentMethodRow,
): PaymentMethodResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
