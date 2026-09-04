import type {
  QuotationApprovalResponseDto,
  QuotationApprovalStatus,
} from './dto/quotation-approval.dto';

export type QuotationApprovalRow = {
  id: string;
  quotation_id: string;
  approver_id: string | null;
  status: QuotationApprovalStatus;
  decision_at: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
};

export function toQuotationApprovalResponse(
  row: QuotationApprovalRow,
): QuotationApprovalResponseDto {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    approverId: row.approver_id,
    status: row.status,
    decisionAt: row.decision_at,
    comments: row.comments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
