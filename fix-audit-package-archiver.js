const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'apps', 'org', 'app', 'api', 'audit-package', 'route.ts');
if (!fs.existsSync(file)) {
  throw new Error('Target file not found: apps/org/app/api/audit-package/route.ts');
}

let text = fs.readFileSync(file, 'utf8');
const oldLine = "      const archive = (archiver as unknown as typeof import('archiver').default).create('zip', { zlib: { level: 9 } });";
const newBlock = `      const archiverFn = (((archiver as { default?: unknown }).default ?? archiver) as unknown as (
        format: 'zip',
        options?: { zlib?: { level?: number } }
      ) => {
        append: (input: Buffer | string, data: { name: string }) => void;
        finalize: () => void | Promise<void>;
        on: (event: string, listener: (...args: unknown[]) => void) => void;
      });
      const archive = archiverFn('zip', { zlib: { level: 9 } });`;

if (text.includes(oldLine)) {
  text = text.replace(oldLine, newBlock);
  fs.writeFileSync(file, text, 'utf8');
  console.log('Patched apps/org/app/api/audit-package/route.ts');
} else {
  console.log('No change needed');
}

console.log('');
console.log('Now run: pnpm -C apps/org build');