import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOCAL_SPEC = './content/openapi/api-reference.yaml';
const OUTPUT_DIR = './content/docs/api-reference';

// Legacy endpoints that get a deprecation callout injected after generation.
const LEGACY_CALLOUTS = {
  'suggested-fees/get.mdx': '/suggested-fees',
  'available-routes/get.mdx': '/available-routes',
};

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

  // 2. Inject legacy callouts into generated MDX files
  for (const [relPath, endpoint] of Object.entries(LEGACY_CALLOUTS)) {
    const filePath = join(OUTPUT_DIR, relPath);
    if (!existsSync(filePath)) {
      console.warn(`  Skipped callout: ${relPath} not found`);
      continue;
    }
    let content = readFileSync(filePath, 'utf-8');
    // Insert callout between the comment and the APIPage component
    content = content.replace(
      '<APIPage',
      `import { Callout } from 'fumadocs-ui/components/callout';\n\n<Callout type="warn">\n  **Legacy:** The \`${endpoint}\` API is no longer actively maintained. New integrations should use the [Swap API](/api-reference/swap/approval/get) instead.\n</Callout>\n\n<APIPage`,
    );
    writeFileSync(filePath, content);
    console.log(`  Injected legacy callout: ${relPath}`);
  }

  // 3. Restore root + icon in meta.json (generateFiles overwrites it)
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
