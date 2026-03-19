import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
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

  // 2. Inject API key callout into all generated endpoint files
  const API_KEY_CALLOUT = `import { Callout } from 'fumadocs-ui/components/callout';\n\n<Callout type="info">\n  **API key required for production.** All requests must include a Bearer token in the \`Authorization\` header:\n\n  \`\`\`\n  Authorization: Bearer <your-api-key>\n  \`\`\`\n\n  [Request your API key and integrator ID now](https://t.me/acrosstg)\n</Callout>\n\n`;

  function getAllMdxFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) files.push(...getAllMdxFiles(full));
      else if (entry.endsWith('.mdx') && entry !== 'index.mdx') files.push(full);
    }
    return files;
  }

  for (const filePath of getAllMdxFiles(OUTPUT_DIR)) {
    let content = readFileSync(filePath, 'utf-8');
    if (!content.includes('<APIPage')) continue;
    content = content.replace('<APIPage', API_KEY_CALLOUT + '<APIPage');
    writeFileSync(filePath, content);
    console.log(`  Injected API key callout: ${filePath.replace(OUTPUT_DIR + '/', '')}`);
  }

  // 3. Inject legacy callouts into generated MDX files (import already added by step 2)
  for (const [relPath, endpoint] of Object.entries(LEGACY_CALLOUTS)) {
    const filePath = join(OUTPUT_DIR, relPath);
    if (!existsSync(filePath)) {
      console.warn(`  Skipped callout: ${relPath} not found`);
      continue;
    }
    let content = readFileSync(filePath, 'utf-8');
    // Insert legacy callout before the API key callout
    const legacyCallout = `<Callout type="warn">\n  **Legacy:** The \`${endpoint}\` API is no longer actively maintained. New integrations should use the [Swap API](/api-reference/swap/approval/get) instead.\n</Callout>\n\n`;
    content = content.replace('<Callout type="info">', legacyCallout + '<Callout type="info">');
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
