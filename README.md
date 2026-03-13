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
# Fetch upstream YAML, patch, save, and generate MDX
pnpm generate:api

# Generate MDX from existing local YAML (no fetch — use after sync:api:update)
pnpm generate:api:local
```

`generate:api` fetches the upstream YAML, applies patches (3 indentation bugs + securitySchemes injection), saves it locally, and generates MDX pages via fumadocs-openapi. Use `generate:api:local` when you've already updated the YAML (e.g. after `sync:api:update`) and just want to regenerate MDX without re-fetching.

### Syncing the spec with the live API

The upstream spec chronically lags behind the live API — missing new response fields, stale types, and 4 endpoints with no response schema at all. The sync script fixes this automatically.

#### How it works

1. Fetches the **fresh upstream YAML** from GitHub
2. Applies the indentation/security patches via `patchSpec()`
3. Calls all 8 live API endpoints with hardcoded sample params
4. Infers OpenAPI schemas from the real responses
5. Diffs inferred schemas vs existing YAML schemas
6. **Adds** new fields — each field gets:
   - `type` inferred from the live JSON value
   - `description` auto-generated from the field name (e.g. `estimatedFillTimeSec` → "Estimated fill time in seconds")
   - `example` captured from the actual API response
   - `x-auto-generated: true` marker so reviewers know what was added automatically
7. **Never removes fields** and **never changes types** — flags both for human review
8. Writes the merged YAML back and generates a markdown summary for the PR body

#### Auto-generated descriptions

Descriptions are derived from field names using camelCase/snake_case splitting and common abbreviation mapping:

| Field name | Generated description |
|---|---|
| `estimatedFillTimeSec` | Estimated fill time in seconds |
| `originChainId` | Origin chain ID |
| `publicRpcUrl` | Public RPC URL |
| `lpFeePct` | LP fee percentage |
| `destinationSpokePoolAddress` | Destination spoke pool address |
| `depositTxHash` | Deposit transaction hash |

These are starting points — reviewers should refine them before merging. All auto-generated fields are findable by searching for `x-auto-generated: true` in the YAML.

#### Auto-populated examples

Example values are captured directly from the live API response. Rules:

- Primitive types (string, number, integer, boolean) get an `example` value
- Strings longer than 120 characters are skipped (too noisy)
- Objects and arrays don't get top-level examples (their children have their own)
- When multiple responses are merged (e.g. from multiple API calls), the first observed value is kept

#### Conservative merge rules

| Scenario | Action |
|---|---|
| New field in live response | Added with `type`, `description`, `example`, marked `x-auto-generated: true` |
| Field in YAML but missing from response | Never removed (may be conditional), logged as warning |
| Type changed (e.g. string → integer) | Never auto-changed, flagged for manual review |
| Existing `description`, `example`, `x-gitbook-*` metadata | Never overwritten |

#### Local usage

```bash
# See what's drifted (read-only, changes nothing)
pnpm sync:api:report

# Apply changes to YAML, then regenerate MDX docs
pnpm sync:api:update && pnpm generate:api:local
```

Note: use `generate:api:local` (not `generate:api`) after syncing. The `--local` flag tells the generate script to use the existing YAML on disk instead of re-fetching upstream, which would overwrite the sync changes.

| Script | What it does |
|---|---|
| `pnpm generate:api` | Fetches upstream YAML, patches it, writes to disk, generates MDX |
| `pnpm generate:api:local` | Generates MDX from the existing local YAML (no fetch, no overwrite) |
| `pnpm sync:api:report` | Read-only drift report against the live API |
| `pnpm sync:api:update` | Merges live API changes into the local YAML |

#### Automated via GitHub Actions

The workflow at `.github/workflows/sync-api-schema.yml` runs **daily at 6 AM UTC** (also triggerable manually from the Actions tab). It:

1. Runs `pnpm sync:api:update` — fetches upstream spec, patches, calls live endpoints, merges new fields into YAML
2. Runs `pnpm generate:api:local` — regenerates MDX from the updated YAML (uses `--local` to preserve sync changes)
3. If any files changed, opens a **PR** on branch `auto/sync-api-schema`
4. PR body includes a rich markdown summary with:
   - Per-endpoint breakdown of added fields with types and example values
   - Type changes flagged for manual review
   - Collapsible sections for large field lists
   - Reminder to review `x-auto-generated` descriptions

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

Multiple `calls` entries can be added to maximize field coverage for endpoints with conditional response fields.

#### File overview

| File | Purpose |
|---|---|
| `scripts/shared/patch-spec.mjs` | Shared `patchSpec()` — fixes 3 upstream YAML indentation bugs + injects `securitySchemes` |
| `scripts/sync/index.mjs` | Orchestrator CLI (`--mode=report` or `--mode=update`), generates markdown summary |
| `scripts/sync/endpoints.mjs` | Endpoint config with sample params for all 8 GET endpoints |
| `scripts/sync/infer-schema.mjs` | JSON response → OpenAPI schema inference, captures examples |
| `scripts/sync/diff-merge.mjs` | Schema differ + conservative merger, auto-generates descriptions |
| `scripts/sync/call-api.mjs` | HTTP client with 15s timeout, 2 retries, skips 4xx |
| `scripts/generate-docs.mjs` | Fetches upstream spec, patches, generates MDX (supports `--local` flag) |
| `.github/workflows/sync-api-schema.yml` | Daily cron + manual trigger, opens PR with sync changes |

## Learn More

- [Fumadocs](https://fumadocs.dev) - documentation framework
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Across Protocol](https://docs.across.to) - Across Protocol documentation
