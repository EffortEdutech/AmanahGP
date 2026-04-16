const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'apps', 'org', 'app', 'api', 'members', 'invite', 'route.ts');
if (!fs.existsSync(file)) {
  throw new Error('Target file not found: apps/org/app/api/members/invite/route.ts');
}

let text = fs.readFileSync(file, 'utf8');

const helper = `function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}`;

if (text.includes("(m) => (m.users as { email: string } | null)?.email?.toLowerCase() === email.toLowerCase()")) {
  text = text.replace(
    "(m) => (m.users as { email: string } | null)?.email?.toLowerCase() === email.toLowerCase()",
    "(m) => relationOne<{ email: string }>(m.users)?.email?.toLowerCase() === email.toLowerCase()"
  );
}

if (text.includes('relationOne<') && !text.includes('function relationOne<')) {
  const match = text.match(/^\s*export\b/m);
  text = match
    ? text.slice(0, match.index) + helper + '\n\n' + text.slice(match.index)
    : helper + '\n\n' + text;
}

fs.writeFileSync(file, text, 'utf8');
console.log('Patched apps/org/app/api/members/invite/route.ts');
console.log('');
console.log('Now run: pnpm -C apps/org build');