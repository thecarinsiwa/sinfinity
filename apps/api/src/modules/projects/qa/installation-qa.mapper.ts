import type {
  CommissioningTestResponseDto,
  InstallationReportResponseDto,
} from './dto/installation-qa.dto';
import type { CommissioningTestResult } from '../commissioning-test-results';

export type InstallationReportRow = {
  id: string;
  installation_id: string;
  author_user_id: string | null;
  summary: string | null;
  findings: string | null;
  document_ids: unknown;
  reported_at: string;
  created_at: string;
};

export type CommissioningTestRow = {
  id: string;
  installation_id: string;
  test_name: string;
  checklist: unknown;
  result: CommissioningTestResult | null;
  performed_by: string | null;
  performed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function parseDocumentIds(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseDocumentIds(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export function parseChecklist(value: unknown): Record<string, unknown> | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseChecklist(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export function toInstallationReportResponse(
  row: InstallationReportRow,
): InstallationReportResponseDto {
  return {
    id: row.id,
    installationId: row.installation_id,
    authorUserId: row.author_user_id,
    summary: row.summary,
    findings: row.findings,
    documentIds: parseDocumentIds(row.document_ids),
    reportedAt: row.reported_at,
    createdAt: row.created_at,
  };
}

export function toCommissioningTestResponse(
  row: CommissioningTestRow,
): CommissioningTestResponseDto {
  return {
    id: row.id,
    installationId: row.installation_id,
    testName: row.test_name,
    checklist: parseChecklist(row.checklist),
    result: row.result,
    performedBy: row.performed_by,
    performedAt: row.performed_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
