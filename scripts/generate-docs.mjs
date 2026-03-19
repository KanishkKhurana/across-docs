import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOCAL_SPEC = './content/openapi/api-reference.yaml';
const OUTPUT_DIR = './content/docs/api-reference';

async function main() {
  if (!existsSync(LOCAL_SPEC)) {
    throw new Error(
      `Local spec not found at ${LOCAL_SPEC}. This file is the source of truth — it should be committed to the repo.`,
    );
  }

  console.log(`Using local spec: ${LOCAL_SPEC}`);

  // 1. Generate MDX files from the local spec
  const openapi = createOpenAPI({ input: [LOCAL_SPEC] });

  await generateFiles({
    input: openapi,
    output: OUTPUT_DIR,
    per: 'operation',
  });

  // 2. Restore root + icon in meta.json (generateFiles overwrites it)
  const metaPath = join(OUTPUT_DIR, 'meta.json');
  const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
  meta.root = true;
  meta.icon = 'Code';
  if (meta.pages && !meta.pages.includes('index')) {
    meta.pages.unshift('index');
  }
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  console.log('API docs generated successfully');
  console.log('meta.json patched with root: true, icon: Code');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
