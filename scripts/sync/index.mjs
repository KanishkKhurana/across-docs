import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { patchSpec } from '../shared/patch-spec.mjs';
import { endpoints } from './endpoints.mjs';
import { callApi } from './call-api.mjs';
import { inferSchema, inferFromMultipleResponses } from './infer-schema.mjs';
import { diffSchemas, mergeIntoDocument, refToPointer } from './diff-merge.mjs';

const SPEC_URL =
  'https://raw.githubusercontent.com/across-protocol/api-reference/master/api-reference.yaml';
const LOCAL_SPEC = './content/openapi/api-reference.yaml';
const REPORT_PATH = './scripts/sync/last-sync-report.json';

function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args.find((a) => a.startsWith('--mode='))?.split('=')[1] || 'report';
  if (mode !== 'report' && mode !== 'update') {
    console.error('Usage: node scripts/sync/index.mjs --mode=report|update');
    process.exit(1);
  }
  return { mode };
}

async function fetchUpstreamSpec() {
  console.log(`Fetching upstream spec from ${SPEC_URL}...`);
  const response = await fetch(SPEC_URL);
  if (!response.ok) throw new Error(`Failed to fetch spec: ${response.status}`);
  const text = await response.text();
  return patchSpec(text);
}

async function main() {
  const { mode } = parseArgs();
  console.log(`\nAPI Schema Sync — mode: ${mode}\n`);

  // 1. Fetch upstream YAML + apply patches
  const patchedYaml = await fetchUpstreamSpec();

  // 2. Parse with yaml.parseDocument() (preserves structure)
  const doc = YAML.parseDocument(patchedYaml);

  const report = {
    timestamp: new Date().toISOString(),
    mode,
    endpoints: [],
  };

  // 3. For each endpoint: call API → infer schema → diff → merge if update mode
  for (const endpoint of endpoints) {
    console.log(`\n--- ${endpoint.name} ---`);
    const endpointReport = {
      name: endpoint.name,
      responses: 0,
      diff: { added: [], missing: [], typeChanges: [] },
      created: false,
      error: null,
    };

    // Call the API with all configured param sets
    const responses = [];
    for (const params of endpoint.calls) {
      console.log(`  Calling ${endpoint.method} ${endpoint.path}...`);
      const data = await callApi(endpoint.method, endpoint.path, params);
      if (data !== null) {
        responses.push(data);
      }
    }

    if (responses.length === 0) {
      console.log('  No successful responses — skipping.');
      endpointReport.error = 'No successful API responses';
      report.endpoints.push(endpointReport);
      continue;
    }

    endpointReport.responses = responses.length;

    // Infer schema from responses
    const inferred = inferFromMultipleResponses(responses);

    // Determine where the schema lives in the YAML
    let schemaPointer = endpoint.schemaPath;

    // If the existing schema uses $ref, resolve it
    if (endpoint.usesRef && endpoint.refPath) {
      const refNode = navigateDoc(doc, endpoint.schemaPath);
      if (refNode && refNode.get && refNode.get('$ref')) {
        // Schema uses $ref — merge into the referenced component schema
        schemaPointer = refToPointer(endpoint.refPath);
        console.log(`  Schema uses $ref → merging into ${schemaPointer}`);
      }
    }

    if (mode === 'update') {
      const { diff, created } = mergeIntoDocument(doc, schemaPointer, inferred);
      endpointReport.diff = diff;
      endpointReport.created = created;
      if (created) {
        console.log(`  CREATED new schema (${diff.added.length} fields)`);
      } else {
        console.log(
          `  Added: ${diff.added.length}, Missing: ${diff.missing.length}, Type changes: ${diff.typeChanges.length}`,
        );
      }
    } else {
      // Report mode — diff against existing without modifying
      const existingSchema = resolveExistingSchema(doc, endpoint);
      if (!existingSchema) {
        const fields = flattenInferred(inferred);
        endpointReport.diff.added = fields;
        endpointReport.created = true;
        console.log(`  NO SCHEMA EXISTS — would create with ${fields.length} fields`);
      } else {
        const diff = diffSchemas(inferred, existingSchema);
        endpointReport.diff = diff;
        console.log(
          `  Added: ${diff.added.length}, Missing: ${diff.missing.length}, Type changes: ${diff.typeChanges.length}`,
        );
      }
    }

    // Log details
    if (endpointReport.diff.added.length > 0) {
      console.log('  New fields:');
      for (const a of endpointReport.diff.added.slice(0, 20)) {
        console.log(`    + ${a.path} (${a.schema?.type || 'unknown'})`);
      }
      if (endpointReport.diff.added.length > 20) {
        console.log(`    ... and ${endpointReport.diff.added.length - 20} more`);
      }
    }
    if (endpointReport.diff.typeChanges.length > 0) {
      console.log('  Type changes (NOT auto-applied):');
      for (const tc of endpointReport.diff.typeChanges) {
        console.log(`    ! ${tc.path}: ${tc.existingType} → ${tc.inferredType}`);
      }
    }
    if (endpointReport.diff.missing.length > 0) {
      console.log('  Missing from response (may be conditional):');
      for (const m of endpointReport.diff.missing.slice(0, 10)) {
        console.log(`    ? ${m.path}`);
      }
      if (endpointReport.diff.missing.length > 10) {
        console.log(`    ... and ${endpointReport.diff.missing.length - 10} more`);
      }
    }

    report.endpoints.push(endpointReport);
  }

  // 4. Write results
  if (mode === 'update') {
    // Serialize document back to YAML
    const output = doc.toString({
      lineWidth: 0, // Don't wrap lines
      defaultKeyType: 'PLAIN',
      defaultStringType: 'PLAIN',
    });
    mkdirSync(dirname(LOCAL_SPEC), { recursive: true });
    writeFileSync(LOCAL_SPEC, output);
    console.log(`\nUpdated spec written to ${LOCAL_SPEC}`);
  }

  // Save report
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${REPORT_PATH}`);

  // Summary
  const totalAdded = report.endpoints.reduce(
    (sum, e) => sum + e.diff.added.length,
    0,
  );
  const totalCreated = report.endpoints.filter((e) => e.created).length;
  const totalTypeChanges = report.endpoints.reduce(
    (sum, e) => sum + e.diff.typeChanges.length,
    0,
  );
  const totalMissing = report.endpoints.reduce(
    (sum, e) => sum + e.diff.missing.length,
    0,
  );

  console.log('\n=== SUMMARY ===');
  console.log(`Endpoints processed: ${report.endpoints.length}`);
  console.log(`New schemas created: ${totalCreated}`);
  console.log(`New fields: ${totalAdded}`);
  console.log(`Type changes (review needed): ${totalTypeChanges}`);
  console.log(`Missing from response: ${totalMissing}`);
}

/**
 * Navigate the YAML document to a dot-path and return the node.
 */
function navigateDoc(doc, dotPath) {
  const parts = dotPath.split('.');
  let node = doc.contents;
  for (const part of parts) {
    if (!node || !node.get) return null;
    node = node.get(part, true);
  }
  return node;
}

/**
 * Resolve the existing plain-JS schema for an endpoint.
 */
function resolveExistingSchema(doc, endpoint) {
  let pointer = endpoint.schemaPath;

  if (endpoint.usesRef && endpoint.refPath) {
    pointer = refToPointer(endpoint.refPath);
  }

  const node = navigateDoc(doc, pointer);
  if (!node) return null;

  return typeof node.toJSON === 'function' ? node.toJSON() : node;
}

/**
 * Flatten inferred schema fields for reporting.
 */
function flattenInferred(schema, prefix = '') {
  const results = [];
  if (schema.type === 'object' && schema.properties) {
    for (const [key, val] of Object.entries(schema.properties)) {
      const path = prefix ? `${prefix}.${key}` : key;
      results.push({ path, schema: val });
      results.push(...flattenInferred(val, path));
    }
  }
  if (schema.type === 'array' && schema.items) {
    results.push(...flattenInferred(schema.items, `${prefix}[]`));
  }
  return results;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
