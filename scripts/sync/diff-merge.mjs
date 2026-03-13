/**
 * Schema differ + conservative merger.
 *
 * Compares inferred schema vs existing YAML schema. Produces a structured diff,
 * then merges using conservative rules:
 *
 * 1. New field → Add with type only. Mark with x-auto-generated: true.
 * 2. Missing field → Never remove. Log warning.
 * 3. Type change → Never auto-change. Log warning.
 * 4. Preserved keys → Never overwrite: description, x-gitbook-*, example, examples, x-codeSamples.
 */

/**
 * Diffs an inferred schema against an existing schema.
 * Returns { added, missing, typeChanges } arrays.
 */
export function diffSchemas(inferred, existing, path = '') {
  const result = { added: [], missing: [], typeChanges: [] };

  if (!inferred || !existing) {
    return result;
  }

  // Compare object properties
  if (inferred.type === 'object' && inferred.properties) {
    const existingProps = existing.properties || {};
    const inferredProps = inferred.properties || {};

    // New fields in inferred but not in existing
    for (const key of Object.keys(inferredProps)) {
      const fieldPath = path ? `${path}.${key}` : key;
      if (!(key in existingProps)) {
        result.added.push({
          path: fieldPath,
          schema: inferredProps[key],
        });
        // Also flatten nested fields for the report
        result.added.push(...flattenFields(inferredProps[key], fieldPath));
      } else {
        // Recurse into nested objects
        const nested = diffSchemas(
          inferredProps[key],
          existingProps[key],
          fieldPath,
        );
        result.added.push(...nested.added);
        result.missing.push(...nested.missing);
        result.typeChanges.push(...nested.typeChanges);

        // Check type changes
        if (
          inferredProps[key].type &&
          existingProps[key].type &&
          inferredProps[key].type !== existingProps[key].type
        ) {
          result.typeChanges.push({
            path: fieldPath,
            existingType: existingProps[key].type,
            inferredType: inferredProps[key].type,
          });
        }
      }
    }

    // Fields in existing but not in inferred (conditional/missing from response)
    for (const key of Object.keys(existingProps)) {
      const fieldPath = path ? `${path}.${key}` : key;
      if (!(key in inferredProps)) {
        result.missing.push({ path: fieldPath });
      }
    }
  }

  // Compare array items
  if (inferred.type === 'array' && inferred.items && existing.items) {
    const nested = diffSchemas(
      inferred.items,
      existing.items,
      `${path}[]`,
    );
    result.added.push(...nested.added);
    result.missing.push(...nested.missing);
    result.typeChanges.push(...nested.typeChanges);
  }

  return result;
}

/**
 * Conservatively merges inferred schema into an existing YAML Document node.
 * Uses the `yaml` package's Document model to preserve comments/formatting.
 *
 * @param {import('yaml').Document} doc - The parsed YAML document
 * @param {string} schemaPointer - Dot-separated path to the schema in the doc
 * @param {object} inferredSchema - The inferred OpenAPI schema
 * @returns {{ diff: object, created: boolean }} The diff report and whether the schema was newly created
 */
export function mergeIntoDocument(doc, schemaPointer, inferredSchema) {
  const parts = schemaPointer.split('.');
  let node = doc.contents;

  // Navigate to parent of schema location
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!node) break;
    node = node.get(part, true);
  }

  const schemaKey = parts[parts.length - 1];
  const existingSchema = node?.get(schemaKey, true);

  if (!existingSchema) {
    // Schema doesn't exist — create it from inferred
    const newSchema = buildSchemaNode(inferredSchema);
    if (node) {
      node.set(schemaKey, newSchema);
    }
    return {
      diff: {
        added: flattenFields(inferredSchema),
        missing: [],
        typeChanges: [],
      },
      created: true,
    };
  }

  // Schema exists — diff and merge new fields only
  const existingPlain =
    typeof existingSchema.toJSON === 'function'
      ? existingSchema.toJSON()
      : existingSchema;
  const diff = diffSchemas(inferredSchema, existingPlain);

  // Apply only root-level additions (those not nested under another addition).
  // buildSchemaNode already includes the full subtree, so adding `limits`
  // also adds `limits.minDeposit` etc.
  const rootAdditions = filterRootAdditions(diff.added);
  for (const addition of rootAdditions) {
    addFieldToSchema(existingSchema, addition.path, addition.schema);
  }

  return { diff, created: false };
}

/**
 * Filters additions to only include root-level ones (no path is a prefix of another).
 * E.g., if both "limits" and "limits.minDeposit" are added, only "limits" is kept
 * because buildSchemaNode for "limits" already includes "minDeposit".
 */
function filterRootAdditions(additions) {
  const addedPaths = new Set(additions.map((a) => a.path));
  return additions.filter((a) => {
    const parentParts = a.path.split('.');
    // Check if any ancestor path was also added
    for (let i = 1; i < parentParts.length; i++) {
      const ancestor = parentParts.slice(0, i).join('.');
      if (addedPaths.has(ancestor)) return false;
    }
    return true;
  });
}

/**
 * Adds a single field to an existing YAML schema node at the given path.
 * Path can be a simple field name ("estimatedFillTimeSec") or a nested
 * path for fields inside existing objects ("existingObj.newField").
 */
function addFieldToSchema(schemaNode, dotPath, schema) {
  const parts = dotPath.split('.');
  let current = schemaNode;

  // Navigate to the parent object for nested paths
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i].replace('[]', '');
    if (part === '') continue;

    // Navigate through properties
    if (!current || typeof current.get !== 'function') return;
    let props = current.get('properties', true);
    if (!props || typeof props.get !== 'function') return;

    let child = props.get(part, true);
    if (!child || typeof child.get !== 'function') return;
    current = child;
  }

  const fieldName = parts[parts.length - 1].replace('[]', '');
  if (!fieldName) return;
  if (!current || typeof current.get !== 'function') return;

  let props = current.get('properties', true);
  if (!props) {
    current.set('properties', {});
    props = current.get('properties', true);
  }
  if (!props || typeof props.get !== 'function') return;

  // Only add if it doesn't already exist
  const existing = props.get(fieldName, true);
  if (!existing) {
    props.set(fieldName, buildSchemaNode(schema, fieldName));
  }
}

/**
 * Common abbreviation map for generating descriptions from field names.
 */
const ABBREVIATIONS = {
  id: 'ID', url: 'URL', uri: 'URI', api: 'API', rpc: 'RPC', lp: 'LP',
  tx: 'transaction', txn: 'transaction', txs: 'transactions',
  usd: 'USD', eth: 'ETH', erc: 'ERC', nft: 'NFT',
  amt: 'amount', addr: 'address', num: 'number', pct: 'percentage',
  src: 'source', dst: 'destination', orig: 'origin', dest: 'destination',
  ts: 'timestamp', config: 'configuration', max: 'maximum', min: 'minimum',
  sec: 'seconds', ms: 'milliseconds', msg: 'message', ref: 'reference',
  info: 'information', idx: 'index', qty: 'quantity', vol: 'volume',
};

/**
 * Generates a human-readable description from a camelCase or snake_case field name.
 * e.g. "estimatedFillTimeSec" → "Estimated fill time in seconds"
 *      "originChainId"        → "Origin chain ID"
 */
export function generateDescription(fieldName) {
  if (!fieldName) return '';

  // Split on camelCase boundaries and underscores
  let words = fieldName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';

  // Map abbreviations
  words = words.map((w) => ABBREVIATIONS[w] || w);

  // Insert "in" before trailing time/size units when preceded by a non-unit word
  const last = words[words.length - 1]?.toLowerCase();
  if (
    words.length >= 2 &&
    (last === 'seconds' || last === 'milliseconds' || last === 'bytes')
  ) {
    const prev = words[words.length - 2]?.toLowerCase();
    if (!['in', 'per', 'of', 'by', 'for'].includes(prev)) {
      words.splice(words.length - 1, 0, 'in');
    }
  }

  // Capitalize first letter
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

  return words.join(' ');
}

/**
 * Builds a plain object suitable for YAML serialization from an inferred schema.
 * Marks all auto-generated fields.  Includes example values and auto-generated
 * descriptions derived from the field name.
 *
 * @param {object} schema - Inferred schema object
 * @param {string} [fieldName] - Field name (used to generate a description)
 */
function buildSchemaNode(schema, fieldName) {
  if (!schema || typeof schema !== 'object') return schema;

  const node = {};
  if (schema.type) node.type = schema.type;
  if (schema.nullable) node.nullable = true;

  // Auto-generate a description from the field name
  if (fieldName) {
    const desc = generateDescription(fieldName);
    if (desc) node.description = desc;
  }

  // Include example for primitive types
  if (
    schema.example !== undefined &&
    schema.type !== 'object' &&
    schema.type !== 'array'
  ) {
    node.example = schema.example;
  }

  node['x-auto-generated'] = true;

  if (schema.type === 'object' && schema.properties) {
    node.properties = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      node.properties[key] = buildSchemaNode(val, key);
    }
  }

  if (schema.type === 'array' && schema.items) {
    node.items =
      Object.keys(schema.items).length > 0
        ? buildSchemaNode(schema.items)
        : {};
  }

  return node;
}

/**
 * Flattens all fields in an inferred schema into an array of { path, schema } entries.
 */
function flattenFields(schema, prefix = '') {
  const results = [];

  if (schema.type === 'object' && schema.properties) {
    for (const [key, val] of Object.entries(schema.properties)) {
      const path = prefix ? `${prefix}.${key}` : key;
      results.push({ path, schema: val });
      results.push(...flattenFields(val, path));
    }
  }

  if (schema.type === 'array' && schema.items) {
    results.push(...flattenFields(schema.items, `${prefix}[]`));
  }

  return results;
}

/**
 * Resolves a $ref path like "#/components/schemas/SuggestedFees"
 * to a dot-separated path: "components.schemas.SuggestedFees"
 */
export function refToPointer(ref) {
  return ref.replace('#/', '').replace(/\//g, '.');
}
