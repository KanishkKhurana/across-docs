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
| `content/openapi/api-reference.yaml` | OpenAPI spec — **source of truth** for all API reference docs |
| `src/app/(home)` | Landing page |
| `src/app/(docs)` | Documentation layout and pages |
| `src/app/api/chat/route.ts` | AI chat assistant route |
| `src/app/api/proxy/route.ts` | API playground proxy (avoids CORS) |
| `src/lib/source.ts` | Content source adapter |
| `src/lib/layout.shared.tsx` | Shared layout options |
| `source.config.ts` | Fumadocs MDX config and frontmatter schema |
| `scripts/` | Build and sync scripts |

## API Reference Docs

The API reference is generated from `content/openapi/api-reference.yaml`. This local file is the **single source of truth** — there is no upstream fetch. All changes to the API spec happen via PRs to this file.

### Generating docs from the spec

```bash
pnpm generate:api
```

This reads the local YAML, generates MDX pages via fumadocs-openapi, injects legacy callouts on deprecated endpoints (`/suggested-fees`, `/available-routes`), and patches `meta.json` with the correct nav config. It runs automatically as a prebuild step (`pnpm build` triggers it).

### Syncing the spec with the live API

The spec can drift from what the live API actually returns — new response fields, changed types, missing schemas. The sync script detects and fixes this automatically by calling the real APIs.

#### How it works

1. Reads the **local YAML** spec
2. Calls all live API endpoints with sample params (9 GET endpoints including `/swap/approval`, `/swap/chains`, `/swap/tokens`, `/suggested-fees`, `/limits`, `/deposit/status`, `/deposits`, `/available-routes`, `/swap/sources`)
3. Infers OpenAPI schemas from the real responses
4. Diffs inferred schemas against the existing YAML schemas
5. **Adds** new fields — each field gets:
   - `type` inferred from the live JSON value
   - `description` auto-generated from the field name (e.g. `estimatedFillTimeSec` → "Estimated fill time in seconds")
   - `example` captured from the actual API response
   - `x-auto-generated: true` marker so reviewers know what was added automatically
6. **Never removes fields** and **never changes types** — flags both for human review
7. Writes the merged YAML back and generates a markdown summary for the PR body

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

Example values are captured directly from the live API response:

- Primitive types (string, number, integer, boolean) get an `example` value
- Strings longer than 120 characters are skipped
- Objects and arrays don't get top-level examples (their children have their own)
- When multiple responses are merged, the first observed value is kept

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
pnpm sync:api:update && pnpm generate:api
```

| Script | What it does |
|---|---|
| `pnpm generate:api` | Generates MDX from the local YAML spec |
| `pnpm sync:api:report` | Read-only drift report against the live API |
| `pnpm sync:api:update` | Merges live API changes into the local YAML |

#### Automated via GitHub Actions

The workflow at `.github/workflows/sync-api-schema.yml` runs **daily at 6 AM UTC** (also triggerable manually from the Actions tab). It:

1. Runs `pnpm sync:api:update` — reads the local spec, calls live endpoints, merges new fields into YAML
2. Runs `pnpm generate:api` — regenerates MDX from the updated YAML
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
| `scripts/generate-docs.mjs` | Reads local spec, generates MDX, injects legacy callouts |
| `scripts/sync/index.mjs` | Orchestrator CLI (`--mode=report` or `--mode=update`), generates markdown summary |
| `scripts/sync/endpoints.mjs` | Endpoint config with sample params for all 9 GET endpoints |
| `scripts/sync/infer-schema.mjs` | JSON response → OpenAPI schema inference, captures examples |
| `scripts/sync/diff-merge.mjs` | Schema differ + conservative merger, auto-generates descriptions |
| `scripts/sync/call-api.mjs` | HTTP client with 15s timeout, 2 retries, skips 4xx |
| `.github/workflows/sync-api-schema.yml` | Daily cron + manual trigger, opens PR with sync changes |

## Learn More

- [Fumadocs](https://fumadocs.dev) - documentation framework
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Across Protocol](https://docs.across.to) - Across Protocol documentation
