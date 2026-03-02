import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SPEC_URL =
  'https://raw.githubusercontent.com/across-protocol/api-reference/master/api-reference.yaml';
const LOCAL_SPEC = './content/openapi/api-reference.yaml';
const OUTPUT_DIR = './content/docs/api-reference';

/**
 * The upstream spec has YAML indentation bugs in the POST /swap/approval
 * response schema (details.properties section under fees.total and
 * fees.totalMax). Three objects have broken structures:
 *
 * 1. swapImpact — `properties:` at wrong indent level + stray x-gitbook inside
 * 2. maxSwapImpact — same pattern as swapImpact
 * 3. app (under totalMax) — `properties: null` + children at wrong indent
 *
 * All three cause fumadocs-openapi to crash with
 * `Object.keys(undefined/null)` during render.
 */
function patchSpec(yaml) {
  let result = yaml;
  let patchCount = 0;

  // --- Patch 1: swapImpact (under fees.total.details) ---
  {
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

    if (result.includes(broken)) {
      result = result.replace(broken, fixed);
      patchCount++;
      console.log('  Patched: swapImpact (fees.total.details)');
    }
  }

  // --- Patch 2: maxSwapImpact (under fees.totalMax.details) ---
  {
    const broken = [
      '                              maxSwapImpact:',
      '                                type: object',
      '                                description: Worst-case swap impact considering slippage.',
      '                                x-gitbook-description-html: >-',
      '                                  <p>Worst-case swap impact considering',
      '                                  slippage.</p>',
      '                              properties:',
      '                                amount:',
      '                                  type: string',
      "                                  example: '4910'",
      '                                amountUsd:',
      '                                  type: string',
      "                                  example: '0.004909993813626033'",
      '                                pct:',
      '                                  type: string',
      "                                  example: '4910951449158618'",
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
      '                                  <p>Worst-case swap impact considering',
      '                                  slippage.</p>',
    ].join('\n');

    const fixed = [
      '                              maxSwapImpact:',
      '                                type: object',
      '                                description: Worst-case swap impact considering slippage.',
      '                                properties:',
      '                                  amount:',
      '                                    type: string',
      "                                    example: '4910'",
      '                                  amountUsd:',
      '                                    type: string',
      "                                    example: '0.004909993813626033'",
      '                                  pct:',
      '                                    type: string',
      "                                    example: '4910951449158618'",
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
      '                                  <p>Worst-case swap impact considering',
      '                                  slippage.</p>',
    ].join('\n');

    if (result.includes(broken)) {
      result = result.replace(broken, fixed);
      patchCount++;
      console.log('  Patched: maxSwapImpact (fees.totalMax.details)');
    }
  }

  // --- Patch 3: app under totalMax.details (properties: null + wrong indent) ---
  {
    const broken = [
      '                              app:',
      '                                type: object',
      '                                description: Maximum application fee portion.',
      '                                properties: null',
      '                                amount:',
      '                                  type: string',
      "                                  example: '0'",
      '                                amountUsd:',
      '                                  type: string',
      "                                  example: '0.0'",
      '                                pct:',
      '                                  type: string',
      "                                  example: '0'",
      '                                token:',
      '                                  type: object',
      '                                  properties:',
      '                                    decimals:',
      '                                      type: integer',
      '                                      example: 18',
      '                                    symbol:',
      '                                      type: string',
      '                                      example: WETH',
      '                                    address:',
      '                                      type: string',
      '                                      example: >-',
      '                                        0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      '                                    name:',
      '                                      type: string',
      '                                      example: Wrapped Ether',
      '                                    chainId:',
      '                                      type: integer',
      '                                      example: 42161',
      '                                x-gitbook-description-html: <p>Maximum application fee portion.</p>',
    ].join('\n');

    const fixed = [
      '                              app:',
      '                                type: object',
      '                                description: Maximum application fee portion.',
      '                                properties:',
      '                                  amount:',
      '                                    type: string',
      "                                    example: '0'",
      '                                  amountUsd:',
      '                                    type: string',
      "                                    example: '0.0'",
      '                                  pct:',
      '                                    type: string',
      "                                    example: '0'",
      '                                  token:',
      '                                    type: object',
      '                                    properties:',
      '                                      decimals:',
      '                                        type: integer',
      '                                        example: 18',
      '                                      symbol:',
      '                                        type: string',
      '                                        example: WETH',
      '                                      address:',
      '                                        type: string',
      '                                        example: >-',
      '                                          0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      '                                      name:',
      '                                        type: string',
      '                                        example: Wrapped Ether',
      '                                      chainId:',
      '                                        type: integer',
      '                                        example: 42161',
      '                                x-gitbook-description-html: <p>Maximum application fee portion.</p>',
    ].join('\n');

    if (result.includes(broken)) {
      result = result.replace(broken, fixed);
      patchCount++;
      console.log('  Patched: app (fees.totalMax.details)');
    }
  }

  if (patchCount === 0) {
    console.warn(
      'Warning: no patch targets found — the upstream spec may have been fixed.',
    );
  } else {
    console.log(`Applied ${patchCount} patch(es) to upstream spec.`);
  }

  return result;
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
