import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { patchSpec } from './shared/patch-spec.mjs';

const SPEC_URL =
  'https://raw.githubusercontent.com/across-protocol/api-reference/master/api-reference.yaml';
const LOCAL_SPEC = './content/openapi/api-reference.yaml';
const OUTPUT_DIR = './content/docs/api-reference';

// --local flag: skip fetching upstream and generate MDX from existing YAML
const localOnly = process.argv.includes('--local');

async function main() {
  if (localOnly) {
    if (!existsSync(LOCAL_SPEC)) {
      throw new Error(`--local specified but ${LOCAL_SPEC} does not exist`);
    }
    console.log(`Using existing local spec: ${LOCAL_SPEC}`);
  } else {
    // 1. Fetch and patch the spec
    console.log(`Fetching spec from ${SPEC_URL}...`);
    const response = await fetch(SPEC_URL);
    if (!response.ok)
      throw new Error(`Failed to fetch spec: ${response.status}`);
    const yaml = await response.text();
    const patched = patchSpec(yaml);

    // 2. Save locally
    mkdirSync(join('.', 'content', 'openapi'), { recursive: true });
    writeFileSync(LOCAL_SPEC, patched);
    console.log(`Saved patched spec to ${LOCAL_SPEC}`);
  }

  // 3. Generate MDX files
  const openapi = createOpenAPI({ input: [LOCAL_SPEC] });

  await generateFiles({
    input: openapi,
    output: OUTPUT_DIR,
    per: 'operation',
  });

  // 4. Restore root + icon in meta.json (generateFiles overwrites it)
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
