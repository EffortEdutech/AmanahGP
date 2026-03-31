'use client';
// apps/admin/components/project/archive-button.tsx
// AmanahHub Console — Archive project button (client component)
// Handles confirm dialog — server actions can be passed as props to client components

import { useRef, useTransition } from 'react';

interface Props {
  orgId:      string;
  projectId:  string;
  action:     (formData: FormData) => Promise<void>;
}

export function ArchiveButton({ orgId, projectId, action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (confirm('Archive this project? It will no longer accept new reports.')) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="orgId"     value={orgId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-[12px] text-red-500 hover:text-red-700 font-medium
                   transition-colors disabled:opacity-50"
      >
        {isPending ? 'Archiving…' : 'Archive project'}
      </button>
    </form>
  );
}
