import type {
  ProcurementApprovalResponseDto,
  ProcurementApprovalStatus,
} from './dto/procurement-approval.dto';

export type ProcurementApprovalRow = {
  id: string;
  procurement_request_id: string;
  procurement_quote_id: string | null;
  approver_id: string | null;
  status: ProcurementApprovalStatus;
  decision_at: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
};

export function toProcurementApprovalResponse(
  row: ProcurementApprovalRow,
): ProcurementApprovalResponseDto {
  return {
    id: row.id,
    procurementRequestId: row.procurement_request_id,
    procurementQuoteId: row.procurement_quote_id,
    approverId: row.approver_id,
    status: row.status,
    decisionAt: row.decision_at,
    comments: row.comments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
