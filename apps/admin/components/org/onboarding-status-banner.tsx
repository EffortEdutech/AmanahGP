// apps/admin/components/org/onboarding-status-banner.tsx
// AmanahHub Console — Contextual banner guiding org admin through onboarding

interface Props {
  orgId:             string;
  status:            string;
  hasClassification: boolean;
}

export function OnboardingStatusBanner({ orgId, status, hasClassification }: Props) {
  if (status === 'approved') return null;

  const banners: Record<string, { color: string; title: string; body: React.ReactNode }> = {
    draft: {
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      title: 'Complete your organization profile',
      body: (
        <span>
          {!hasClassification ? (
            <>
              Next: <a href={`/orgs/${orgId}/classify`} className="font-medium underline">
                Complete governance classification
              </a> to unlock submission.
            </>
          ) : (
            <>
              Your profile is ready.{' '}
              <a href={`/orgs/${orgId}/submit`} className="font-medium underline">
                Review and submit for approval →
              </a>
            </>
          )}
        </span>
      ),
    },
    submitted: {
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      title: 'Application under review',
      body: 'A platform reviewer is checking your organization profile. We\'ll notify you when a decision is made.',
    },
    changes_requested: {
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      title: 'Changes requested',
      body: (
        <span>
          The reviewer has requested changes.{' '}
          <a href={`/orgs/${orgId}/edit`} className="font-medium underline">
            Update your profile
          </a>{' '}
          and resubmit.
        </span>
      ),
    },
    rejected: {
      color: 'bg-red-50 border-red-200 text-red-700',
      title: 'Application not approved',
      body: 'Your application was not approved. Please contact support for more information.',
    },
  };

  const banner = banners[status];
  if (!banner) return null;

  return (
    <div className={`mb-6 rounded-md border px-4 py-3 ${banner.color}`}>
      <p className="text-sm font-semibold mb-0.5">{banner.title}</p>
      <p className="text-sm">{banner.body}</p>
    </div>
  );
}
