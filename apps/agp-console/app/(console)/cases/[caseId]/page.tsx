import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { GovernanceActionItemForm } from "@/components/governance-action-item-form";
import { GovernanceActionItemTable } from "@/components/governance-action-item-table";
import { GovernanceActionUpdateForm } from "@/components/governance-action-update-form";
import { GovernanceActionUpdateTable } from "@/components/governance-action-update-table";
import { GovernanceCaseAssignmentForm } from "@/components/governance-case-assignment-form";
import { GovernanceCaseAssignmentTable } from "@/components/governance-case-assignment-table";
import { GovernanceCaseDecisionForm } from "@/components/governance-case-decision-form";
import { GovernanceCaseDecisionTable } from "@/components/governance-case-decision-table";
import { GovernanceCaseStatusForm } from "@/components/governance-case-status-form";
import { GovernanceEvidenceForm } from "@/components/governance-evidence-form";
import { GovernanceEvidenceTable } from "@/components/governance-evidence-table";
import { GovernanceFindingForm } from "@/components/governance-finding-form";
import { GovernanceFindingsTable } from "@/components/governance-findings-table";
import { StatsCard } from "@/components/stats-card";
import { TrustSnapshotPublishForm } from "@/components/trust-snapshot-publish-form";
import { requireConsoleAccess } from "@/lib/console/access";
import { getGovernanceCaseActionItemSummary, listGovernanceCaseActionItems } from "@/lib/console/governance-action-items";
import { getGovernanceCaseActionUpdateSummary, listGovernanceCaseActionUpdates } from "@/lib/console/governance-action-updates";
import { getGovernanceCaseDecisionSummary, listGovernanceCaseDecisions } from "@/lib/console/governance-decisions";
import { formatDate, formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import {
  getGovernanceCaseFindingsSummary,
  getGovernanceReviewCaseById,
  listAssignableConsoleUsers,
  listGovernanceCaseAssignments,
  listGovernanceCaseEvidence,
  listGovernanceCaseFindings,
} from "@/lib/console/server";
import { listOrganizationTrustSnapshots } from "@/lib/console/trust-snapshots";

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high") return "badge badge-amber";
  if (priority === "low") return "badge badge-neutral";
  return "badge badge-green";
}

function trustLevelBadgeClass(level: string) {
  if (level === "exemplary") return "badge badge-green";
  if (level === "assured") return "badge badge-green";
  if (level === "developing") return "badge badge-amber";
  if (level === "watchlist") return "badge badge-red";
  return "badge badge-neutral";
}

export default async function GovernanceCaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [reviewCase, assignments, consoleUsers, findings, evidence, findingsSummary, decisions, decisionSummary, actionItems, actionSummary, actionUpdates, actionUpdateSummary] = await Promise.all([
    getGovernanceReviewCaseById(caseId),
    listGovernanceCaseAssignments(caseId),
    listAssignableConsoleUsers(),
    listGovernanceCaseFindings(caseId),
    listGovernanceCaseEvidence(caseId),
    getGovernanceCaseFindingsSummary(caseId),
    listGovernanceCaseDecisions(caseId),
    getGovernanceCaseDecisionSummary(caseId),
    listGovernanceCaseActionItems(caseId),
    getGovernanceCaseActionItemSummary(caseId),
    listGovernanceCaseActionUpdates(caseId),
    getGovernanceCaseActionUpdateSummary(caseId),
  ]);

  const trustSnapshots = await listOrganizationTrustSnapshots(reviewCase.organization_id);

  const currentTrustSnapshot = trustSnapshots.find((row) => row.is_current) ?? null;

  return (
    <ConsoleShell
      title={reviewCase.case_code}
      description="Governance review case detail for reviewer, scholar, approval, remediation, and donor trust publication."
      currentPath="/cases"
      roles={roles}
      userEmail={user.email}
    >
      {query.message ? <div className="notice">{decodeURIComponent(query.message)}</div> : null}
      {query.error ? <div className="notice notice-warning">{decodeURIComponent(query.error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="status" value={titleCase(reviewCase.status)} note="Current workflow stage" />
        <StatsCard label="priority" value={titleCase(reviewCase.priority)} note="Operational urgency" />
        <StatsCard label="assignments" value={assignments.length} note="Reviewer, scholar, and approver slots" />
        <StatsCard label="open findings" value={findingsSummary.open_findings} note="Issues still requiring action" />
        <StatsCard label="open actions" value={actionSummary.open_action_items + actionSummary.in_progress_action_items + actionSummary.submitted_action_items} note="Corrective work still pending" />
        <StatsCard label="pending submissions" value={actionUpdateSummary.pending_updates} note="Organisation responses awaiting review" />
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Case overview</div>
            <p className="muted">Opened {formatDateTime(reviewCase.opened_at)} · Updated {formatDateTime(reviewCase.updated_at)}</p>
          </div>
          <div className="row">
            <Link className="btn btn-secondary" href="/cases">
              <ArrowLeft size={16} />
              Back to cases
            </Link>
            <Link className="btn btn-secondary" href={`/organisations/${reviewCase.organization_id}`}>
              <Building2 size={16} />
              Open organisation
            </Link>
          </div>
        </div>

        <div className="row">
          <span className={statusBadgeClass(reviewCase.status)}>{titleCase(reviewCase.status)}</span>
          <span className={priorityBadgeClass(reviewCase.priority)}>{titleCase(reviewCase.priority)}</span>
          {reviewCase.outcome ? <span className="badge badge-neutral">{titleCase(reviewCase.outcome)}</span> : null}
        </div>

        <div className="muted">Organisation: {reviewCase.organization?.legal_name || reviewCase.organization?.name || "—"}</div>
        <div className="muted">Registration no: {reviewCase.organization?.registration_no || "—"}</div>
        <div className="muted">Review type: {titleCase(reviewCase.review_type)}</div>
        <div className="muted">Due date: {reviewCase.due_at ? formatDate(reviewCase.due_at) : "—"}</div>
        <div className="muted">Submitted: {formatDateTime(reviewCase.submitted_at)}</div>
        <div className="muted">Reviewer started: {formatDateTime(reviewCase.review_started_at)}</div>
        <div className="muted">Scholar started: {formatDateTime(reviewCase.scholar_started_at)}</div>
        <div className="muted">Approval started: {formatDateTime(reviewCase.approval_started_at)}</div>
        <div className="muted">Closed: {formatDateTime(reviewCase.closed_at)}</div>
      </section>

      <section className="grid-cards">
        <section className="panel section stack">
          <div className="h2">Decision center</div>
          <div className="muted">Formal reviewer, scholar, and approver decisions. Terminal decisions emit governance trust signals.</div>
          <GovernanceCaseDecisionForm caseId={reviewCase.id} currentStatus={reviewCase.status} />
        </section>

        <section className="panel section stack">
          <div className="h2">Trust publication</div>
          {currentTrustSnapshot ? (
            <div className="notice">
              Current snapshot: <span className={trustLevelBadgeClass(currentTrustSnapshot.trust_level)}>{titleCase(currentTrustSnapshot.trust_level)}</span>{" "}
              <span className={statusBadgeClass(currentTrustSnapshot.governance_status)}>{titleCase(currentTrustSnapshot.governance_status.replaceAll("_", " "))}</span>
            </div>
          ) : (
            <div className="notice notice-warning">No donor-facing trust snapshot published yet for this organisation.</div>
          )}
          <TrustSnapshotPublishForm
            organizationId={reviewCase.organization_id}
            caseId={reviewCase.id}
            currentOutcome={reviewCase.outcome}
            currentStatus={reviewCase.status}
          />
        </section>
      </section>

      <section className="panel section stack">
        <div className="h2">Decision log</div>
        <GovernanceCaseDecisionTable rows={decisions} />
      </section>

      <section className="grid-cards">
        <section className="panel section stack">
          <div className="h2">Corrective action plan</div>
          <div className="muted">Convert findings into concrete action items for the organisation.</div>
          <GovernanceActionItemForm
            caseId={reviewCase.id}
            findings={findings.map((finding) => ({ id: finding.id, title: finding.title }))}
          />
        </section>

        <section className="panel section stack">
          <div className="h2">Action item summary</div>
          <div className="grid-cards">
            <StatsCard label="total" value={actionSummary.total_action_items} note="All remediation items" />
            <StatsCard label="verified" value={actionSummary.verified_action_items} note="Items closed by reviewer" />
            <StatsCard label="submitted" value={actionSummary.submitted_action_items} note="Awaiting reviewer verification" />
            <StatsCard label="overdue" value={actionSummary.overdue_action_items} note="Past due and unresolved" />
          </div>
        </section>
      </section>

      <section className="panel section stack">
        <div className="h2">Corrective actions</div>
        <GovernanceActionItemTable caseId={reviewCase.id} rows={actionItems} />
      </section>

      <section className="grid-cards">
        <section className="panel section stack">
          <div className="h2">Organisation remediation submission</div>
          <div className="muted">Canonical bridge point for AmanahOS submissions and reviewer review.</div>
          <GovernanceActionUpdateForm caseId={reviewCase.id} actionItems={actionItems} />
        </section>

        <section className="panel section stack">
          <div className="h2">Submission inbox summary</div>
          <div className="grid-cards">
            <StatsCard label="pending" value={actionUpdateSummary.pending_updates} note="Awaiting reviewer action" />
            <StatsCard label="accepted" value={actionUpdateSummary.accepted_updates} note="Accepted submissions" />
            <StatsCard label="rejected" value={actionUpdateSummary.rejected_updates} note="Rejected submissions" />
            <StatsCard label="more info" value={actionUpdateSummary.needs_more_info_updates} note="Needs clarification from organisation" />
          </div>
        </section>
      </section>

      <section className="panel section stack">
        <div className="h2">Remediation submission inbox</div>
        <GovernanceActionUpdateTable caseId={reviewCase.id} rows={actionUpdates} />
      </section>

      <section className="grid-cards">
        <section className="panel section stack">
          <div className="h2">Assign reviewer, scholar, or approver</div>
          <div className="notice">Assign from users who already have console roles.</div>
          <GovernanceCaseAssignmentForm
            caseId={reviewCase.id}
            users={consoleUsers.map((user) => ({
              id: user.id,
              email: user.email,
              display_name: user.display_name,
              auth_provider_user_id: user.auth_provider_user_id,
              console_roles: user.console_roles,
            }))}
          />
        </section>

        <section className="panel section stack">
          <div className="h2">Assignments</div>
          <GovernanceCaseAssignmentTable rows={assignments} />
        </section>
      </section>

      <section className="grid-cards">
        <section className="panel section stack">
          <div className="h2">Record finding</div>
          <div className="muted">Capture governance gaps, Shariah concerns, financial issues, and corrective recommendations.</div>
          <GovernanceFindingForm caseId={reviewCase.id} />
        </section>

        <section className="panel section stack">
          <div className="h2">Record evidence</div>
          <div className="muted">Evidence can be a note, link, document reference, or snapshot tied to the whole case or one finding.</div>
          <GovernanceEvidenceForm
            caseId={reviewCase.id}
            findings={findings.map((finding) => ({ id: finding.id, title: finding.title }))}
          />
        </section>
      </section>

      <section className="panel section stack">
        <div className="h2">Findings</div>
        <GovernanceFindingsTable caseId={reviewCase.id} rows={findings} />
      </section>

      <section className="panel section stack">
        <div className="h2">Evidence log</div>
        <GovernanceEvidenceTable rows={evidence} />
      </section>
    </ConsoleShell>
  );
}

