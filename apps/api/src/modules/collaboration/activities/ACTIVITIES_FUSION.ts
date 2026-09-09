/**
 * Activities fusion (Phase 18)
 * ============================
 *
 * Decision: do **not** CRUD the unused `activities` table.
 *
 * Source of truth: CRM `sales_activities` via `/sales-activities`
 * (relatedType allowlist: lead | customer | opportunity).
 *
 * Collaboration exposes `GET /activities` as a read-only alias that delegates
 * to `SalesActivitiesService.findAll`. Mutations stay on `/sales-activities`.
 *
 * Rationale (ROADMAP + database/modules/17_communication.md):
 * - Overlapping models (type, subject, polymorphic link, owner, schedule)
 * - CRM CRUD + activity_types already shipped in Phase 5
 * - Zero clients on table `activities`
 *
 * Revisit only if a transverse entity allowlist (ticket, PO, project, …)
 * becomes a real product requirement.
 */
export const ACTIVITIES_FUSION_NOTE =
  'GET /activities aliases sales_activities; writes on /sales-activities only';
