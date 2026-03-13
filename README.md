# Across Docs

Documentation site for [Across Protocol](https://across.to), built with [Fumadocs](https://fumadocs.dev) and Next.js.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 to see the docs.

## Project Structure

| Path | Description |
|---|---|
| `content/docs/` | Documentation content (MDX + meta.json) |
| `content/openapi/api-reference.yaml` | OpenAPI spec (auto-synced) |
| `app/(home)` | Landing page and other pages |
| `app/docs` | Documentation layout and pages |
| `app/api/search/route.ts` | Search route handler |
| `lib/source.ts` | Content source adapter |
| `lib/layout.shared.tsx` | Shared layout options |
| `source.config.ts` | Fumadocs MDX config and frontmatter schema |
| `scripts/` | Build and sync scripts |

## API Reference Docs

The API reference is generated from an OpenAPI spec sourced from the upstream [`across-protocol/api-reference`](https://github.com/across-protocol/api-reference) repo. Two scripts manage this:

### Generating docs from the spec

```bash
pnpm generate:api
```

Fetches the upstream YAML, applies indentation patches (3 known bugs in the upstream spec), saves it locally, and generates MDX pages via fumadocs-openapi.

### Syncing the spec with the live API

The upstream spec chronically lags behind the live API — missing new response fields, stale types, and 4 endpoints with no response schema at all. The sync script fixes this automatically.

#### How it works

1. Fetches the **fresh upstream YAML** from GitHub
2. Applies the 3 indentation patches
3. Calls all 8 live API endpoints with hardcoded sample params
4. Infers OpenAPI schemas from the real responses
5. Diffs inferred schemas vs existing YAML schemas
6. **Adds** new fields (marked `x-auto-generated: true`), **never removes or changes types**
7. Writes the merged YAML back

#### Conservative merge rules

| Scenario | Action |
|---|---|
| New field in live response | Added to YAML, marked `x-auto-generated: true` |
| Field in YAML but missing from response | Never removed (may be conditional) |
| Type changed (e.g. string to integer) | Never auto-changed, flagged for review |
| Descriptions, examples, `x-gitbook-*` metadata | Never touched |

#### Local usage

```bash
# See what's drifted (read-only, changes nothing)
pnpm sync:api:report

# Apply changes to YAML, then regenerate MDX docs
pnpm sync:api:update && pnpm generate:api
```

#### Automated via GitHub Actions

The workflow at `.github/workflows/sync-api-schema.yml` runs **daily at 6 AM UTC** (also triggerable manually from the Actions tab). It:

1. Runs `pnpm sync:api:update` to merge new fields into the spec
2. Runs `pnpm generate:api` to regenerate MDX docs
3. If any files changed, opens a **PR** on branch `auto/sync-api-schema`
4. PR body lists exactly which fields were added/changed per endpoint

Nothing hits main without human review.

#### Adding new endpoints

If Across ships a new API endpoint, add an entry to `scripts/sync/endpoints.mjs`:

```js
{
  name: 'GET /new-endpoint',
  method: 'GET',
  path: '/new-endpoint',
  calls: [{ someParam: 'value' }],
  schemaPath: 'paths./new-endpoint.get.responses.200.content.application/json.schema',
  usesRef: false,
},
```

#### File overview

| File | Purpose |
|---|---|
| `scripts/shared/patch-spec.mjs` | Shared `patchSpec()` for 3 upstream YAML bugs |
| `scripts/sync/index.mjs` | Orchestrator CLI (`--mode=report` or `--mode=update`) |
| `scripts/sync/endpoints.mjs` | Endpoint config with sample params |
| `scripts/sync/infer-schema.mjs` | JSON response to OpenAPI schema inference |
| `scripts/sync/diff-merge.mjs` | Schema differ + conservative merger |
| `scripts/sync/call-api.mjs` | HTTP client with retry and timeout |
| `scripts/generate-docs.mjs` | Fetches upstream spec, patches, generates MDX |

## Learn More

- [Fumadocs](https://fumadocs.dev) - documentation framework
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Across Protocol](https://docs.across.to) - Across Protocol documentation
