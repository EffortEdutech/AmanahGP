const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'apps', 'org', 'app', 'api', 'audit-package', 'route.ts');
if (!fs.existsSync(file)) {
  throw new Error('Target file not found: apps/org/app/api/audit-package/route.ts');
}

let text = fs.readFileSync(file, 'utf8');
const oldText = "  return new NextResponse(zipBuffer, {";
const newText = "  return new NextResponse(new Uint8Array(zipBuffer), {";

if (text.includes(oldText)) {
  text = text.replace(oldText, newText);
  fs.writeFileSync(file, text, 'utf8');
  console.log('Patched apps/org/app/api/audit-package/route.ts');
} else {
  console.log('No change needed');
}

console.log('');
console.log('Now run: pnpm -C apps/org build');