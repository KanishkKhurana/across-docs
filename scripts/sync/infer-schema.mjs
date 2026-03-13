/**
 * Infers an OpenAPI 3.0 schema from a JSON value.
 * Handles strings, numbers, integers, booleans, arrays, nested objects, nulls.
 */
export function inferSchema(value) {
  if (value === null || value === undefined) {
    return { nullable: true };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} };
    }
    // Merge schemas from all array items
    const itemSchemas = value.map(inferSchema);
    const merged = mergeSchemas(itemSchemas);
    return { type: 'array', items: merged };
  }

  if (typeof value === 'object') {
    const properties = {};
    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferSchema(val);
    }
    return { type: 'object', properties };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
  }

  if (typeof value === 'string') {
    return { type: 'string' };
  }

  return {};
}

/**
 * Merges multiple schemas into one (union of all fields).
 * Used to combine schemas inferred from different array items or multiple API responses.
 */
export function mergeSchemas(schemas) {
  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];

  // If all schemas have the same non-object type, return that type
  const types = new Set(schemas.map((s) => s.type).filter(Boolean));

  // If any schema is an object, merge properties
  if (types.has('object')) {
    const allProperties = {};
    for (const schema of schemas) {
      if (schema.properties) {
        for (const [key, val] of Object.entries(schema.properties)) {
          if (!allProperties[key]) {
            allProperties[key] = val;
          } else {
            // Merge nested schemas
            allProperties[key] = mergeSchemas([allProperties[key], val]);
          }
        }
      }
    }
    return { type: 'object', properties: allProperties };
  }

  // If any schema is an array, merge items
  if (types.has('array')) {
    const itemSchemas = schemas
      .filter((s) => s.items && Object.keys(s.items).length > 0)
      .map((s) => s.items);
    const mergedItems =
      itemSchemas.length > 0 ? mergeSchemas(itemSchemas) : {};
    return { type: 'array', items: mergedItems };
  }

  // Mixed primitive types — use first non-nullable
  const nonNullable = schemas.find((s) => !s.nullable);
  return nonNullable || schemas[0];
}

/**
 * Merges multiple API responses for the same endpoint into a single inferred schema.
 */
export function inferFromMultipleResponses(responses) {
  const schemas = responses.map(inferSchema);
  return mergeSchemas(schemas);
}
