import type { SupplierEvaluationResponseDto } from './dto/supplier-evaluation.dto';

export type SupplierEvaluationRow = {
  id: string;
  supplier_id: string;
  evaluated_by: string | null;
  evaluated_at: string;
  quality_score: number | null;
  delivery_score: number | null;
  price_score: number | null;
  overall_score: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
};

export function toSupplierEvaluationResponse(
  row: SupplierEvaluationRow,
): SupplierEvaluationResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    evaluatedBy: row.evaluated_by,
    evaluatedAt: row.evaluated_at,
    qualityScore: row.quality_score,
    deliveryScore: row.delivery_score,
    priceScore: row.price_score,
    overallScore: row.overall_score,
    comments: row.comments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolveOverallScore(
  qualityScore: number | null | undefined,
  deliveryScore: number | null | undefined,
  priceScore: number | null | undefined,
  overallScore?: string | null,
): string | null {
  if (overallScore != null && overallScore !== '') {
    return Number(overallScore).toFixed(2);
  }
  const scores = [qualityScore, deliveryScore, priceScore].filter(
    (value): value is number => value != null,
  );
  if (!scores.length) return null;
  const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return avg.toFixed(2);
}
