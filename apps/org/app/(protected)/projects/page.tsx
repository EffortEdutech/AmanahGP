// apps/org/app/(protected)/projects/page.tsx
// amanahOS — Projects
// [MOVE FROM apps/admin] Sprint 18: full project CRUD migrates here.
// Sprint 14: stub with ComingSoonModule.

import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Projects — amanahOS' };

export default function ProjectsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create and manage your charitable projects</p>
      </div>
      <ComingSoonModule
        label="Projects"
        sprintTarget="Sprint 18"
        description="Project management is currently available in AmanahHub Console. It will migrate here in Sprint 18 as part of the org-management refactor."
        consoleLink
      />
    </div>
  );
}
