import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/pull-icon.mjs <icon-slug>");
  process.exit(1);
}

const res = await fetch(`http://localhost:3000/api/registry/icons/${slug}`);
const json = await res.json();

if (!res.ok) {
  console.error("Failed:", json);
  process.exit(1);
}

for (const file of json.data.files) {
  const target = `src/components/${file.path}`;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.content);
  console.log("wrote", target);
}