import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SPEC_URL =
  'https://raw.githubusercontent.com/across-protocol/api-reference/master/api-reference.yaml';
const LOCAL_SPEC = './content/openapi/api-reference.yaml';
const OUTPUT_DIR = './content/docs/api-reference';

/**
 * The upstream spec has a YAML indentation bug in the POST /swap/approval
 * response schema. The `swapImpact` object under `details.properties` has its
 * `properties` block at the wrong indentation level (sibling instead of child),
 * and a stray `x-gitbook-description-html` ends up inside `properties` as a
 * schema property. This causes fumadocs-openapi to crash at render time.
 *
 * Fix: replace the broken block with the correctly-structured equivalent
 * (matching the GET /swap/approval response which has identical schema but
 * correct indentation).
 */
function patchSpec(yaml) {
  // The broken block in the POST /swap/approval response:
  // - swapImpact has x-gitbook-description-html before properties
  // - properties: is a sibling of swapImpact (wrong indent)
  // - x-gitbook-description-html appears again inside properties
  const broken = [
    '                              swapImpact:',
    '                                type: object',
    '                                description: >-',
    '                                  Expected swap impact with best-case execution',
    '                                  (no slippage).',
    '                                x-gitbook-description-html: >-',
    '                                  <p>Expected swap impact with best-case',
    '                                  execution (no slippage).</p>',
    '                              properties:',
    '                                amount:',
    '                                  type: string',
    "                                  example: '-2490'",
    '                                amountUsd:',
    '                                  type: string',
    "                                  example: '-0.002490006186373967'",
    '                                pct:',
    '                                  type: string',
    "                                  example: '-2490491832281262'",
    '                                token:',
    '                                  type: object',
    '                                  properties:',
    '                                    decimals:',
    '                                      type: integer',
    '                                      example: 6',
    '                                    symbol:',
    '                                      type: string',
    '                                      example: USDC',
    '                                    address:',
    '                                      type: string',
    '                                      example: >-',
    '                                        0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    '                                    name:',
    '                                      type: string',
    '                                      example: USD Coin',
    '                                    chainId:',
    '                                      type: integer',
    '                                      example: 10',
    '                                x-gitbook-description-html: >-',
    '                                  <p>Expected swap impact with best-case',
    '                                  execution (no slippage).</p>',
  ].join('\n');

  // The correct version (matching GET /swap/approval response structure):
  // - properties is a child of swapImpact (correct indent)
  // - x-gitbook-description-html appears once, after properties
  const fixed = [
    '                              swapImpact:',
    '                                type: object',
    '                                description: >-',
    '                                  Expected swap impact with best-case execution',
    '                                  (no slippage).',
    '                                properties:',
    '                                  amount:',
    '                                    type: string',
    "                                    example: '-2490'",
    '                                  amountUsd:',
    '                                    type: string',
    "                                    example: '-0.002490006186373967'",
    '                                  pct:',
    '                                    type: string',
    "                                    example: '-2490491832281262'",
    '                                  token:',
    '                                    type: object',
    '                                    properties:',
    '                                      decimals:',
    '                                        type: integer',
    '                                        example: 6',
    '                                      symbol:',
    '                                        type: string',
    '                                        example: USDC',
    '                                      address:',
    '                                        type: string',
    '                                        example: >-',
    '                                          0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    '                                      name:',
    '                                        type: string',
    '                                        example: USD Coin',
    '                                      chainId:',
    '                                        type: integer',
    '                                        example: 10',
    '                                x-gitbook-description-html: >-',
    '                                  <p>Expected swap impact with best-case',
    '                                  execution (no slippage).</p>',
  ].join('\n');

  if (!yaml.includes(broken)) {
    console.warn(
      'Warning: spec patch target not found — the upstream spec may have been fixed.',
    );
    return yaml;
  }

  console.log('Patched swapImpact schema indentation bug in upstream spec.');
  return yaml.replace(broken, fixed);
}

async function main() {
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
