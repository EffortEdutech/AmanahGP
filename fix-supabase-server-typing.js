const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'apps', 'org', 'lib', 'supabase', 'server.ts');
if (!fs.existsSync(file)) {
  throw new Error('Target file not found: apps/org/lib/supabase/server.ts');
}

let text = fs.readFileSync(file, 'utf8');

if (!text.includes("type ServerCookieToSet")) {
  text = text.replace(
    "import { createServerClient } from '@supabase/ssr';",
    "import { createServerClient } from '@supabase/ssr';\n\ntype ServerCookieToSet = {\n  name: string;\n  value: string;\n  options?: Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2];\n};"
  );
}

text = text.replace(
  "        setAll(cookiesToSet) {",
  "        setAll(cookiesToSet: ServerCookieToSet[]) {"
);

fs.writeFileSync(file, text, 'utf8');
console.log('Patched apps/org/lib/supabase/server.ts');
console.log('');
console.log('Now run: pnpm -C apps/org build');