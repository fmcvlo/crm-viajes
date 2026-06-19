# Ponytail — Lazy Senior Developer Framework

Before writing any code, walk this decision ladder in order:

1. **Does this need to exist?** — YAGNI. If no, say so and stop.
2. **Can stdlib handle it?** — Use the language's built-in tools first.
3. **Is there a native platform feature?** — Prefer what the platform already provides.
4. **Is a dependency already installed that works?** — Reuse before adding.
5. **Can it be one line?** — Prefer concise over verbose.
6. **Only then** — Write the minimum necessary code.

Default intensity: **Full** — enforce the ladder, minimal explanation.

Protected always: input validation, error handling, security, accessibility.

Mark deliberate shortcuts with a comment: `// ponytail: <ceiling>, <upgrade path>`

---

## Skills

### `/ponytail [lite|full|ultra]`
Set intensity level:
- **lite** — suggest the lazier alternative alongside your solution
- **full** (default) — enforce the decision ladder strictly
- **ultra** — question requirements aggressively; ship the simplest version first

### `/ponytail-review`
Audit a diff for over-engineering. Scope: complexity only (not bugs, security, or perf).
Output format: `L<line>: <tag> <what>. <replacement>.`
Tags: `delete` · `stdlib` · `native` · `yagni` · `shrink`
Conclude with: `net: -<N> lines possible.` or `Lean already. Ship.`

### `/ponytail-audit`
Whole-repo scan for over-engineering. Same tags as review, ranked by impact.
Output format: `<tag> <what to cut>. <replacement>. [path]`
Conclude with: `net: -<N> lines, -<M> deps possible.`

### `/ponytail-debt`
Grep the repo for `ponytail:` comments and produce a debt ledger.
One row per marker grouped by file: file · line · concept · ceiling · upgrade trigger.
Flag entries with no upgrade trigger as risk (`no-trigger`).

---

# Next.js Best Practices

## File Conventions (App Router)
- `page.tsx` — route UI, `layout.tsx` — shared layout, `loading.tsx` — Suspense boundary
- `error.tsx` — error boundary (must be Client Component), `not-found.tsx`, `route.ts` — API endpoint
- Dynamic routes: `[slug]`, catch-all: `[...slug]`, optional: `[[...slug]]`
- Route groups `(name)` don't affect URLs. Private folders `_name` excluded from routing.
- `route.ts` and `page.tsx` **cannot coexist in the same folder**.
- Middleware: `middleware.ts` (v14-15) → `proxy.ts` (v16+)

## RSC Boundaries
- Client Components **cannot** be async functions — move data fetching to server parent.
- Server Components cannot pass functions, Dates, Maps, Sets, class instances, or Symbols to client components — serialize to primitives/plain objects or use Server Actions.
- Functions marked `'use server'` can be passed to client components (Server Actions are the exception).

## Directives
- `'use client'` — required for hooks (`useState`, `useEffect`), event handlers, browser APIs (`window`, `localStorage`).
- `'use server'` — marks Server Actions. Can be defined inline in server components or in separate files.
- `'use cache'` — enables caching; requires `cacheComponents: true` in config. Supports `cacheLife()`, `cacheTag()`, `updateTag()`.

## Async Patterns (Next.js 15+)
- `params`, `searchParams`, `cookies()`, `headers()` are now async — always type as `Promise<...>` and await.
- In non-async components, use `React.use()` to unwrap promises.
- `generateMetadata` also receives promises — await before accessing values.
- Migration tool: `npx @next/codemod@latest next-async-request-api .`

## Data Patterns
| Use case | Pattern |
|---|---|
| Internal reads | Server Component (no API, no waterfall, secrets stay server-side) |
| Mutations | Server Action (end-to-end type safety, POST only, progressive enhancement) |
| External API / webhooks / cacheable GETs | Route Handler |

- Avoid sequential fetches — use `Promise.all()` for parallel requests.
- Prefer passing initial data from Server Component to Client Components over client-side fetching.
- Server Actions always POST → no HTTP caching. Use Route Handlers for cacheable reads.

## Error Handling
- `error.tsx` catches errors in a route segment and children — must be Client Component.
- `global-error.tsx` catches root layout errors — must include `<html>` and `<body>`.
- **Never wrap `redirect()`, `notFound()`, `unauthorized()` in try-catch** — they throw special exceptions Next.js handles internally. Use `unstable_rethrow()` if needed.
- `redirect()` → 307, `permanentRedirect()` → 308 (cached by browser, use for URL migrations).

## Runtime Selection
- Default to **Node.js runtime** — no config needed, full Node.js API support.
- Use Edge runtime only when: project already uses it, or there's a documented latency requirement, and all dependencies are Edge-compatible.

## Route Handlers
- Access cookies, headers, Node.js APIs. No React hooks or browser APIs.
- Dynamic params are now a Promise: `{ params }: { params: Promise<{ id: string }> }` — must be awaited.

## Image Optimization
- Always use `next/image` over `<img>`.
- Local images: dimensions inferred automatically. Remote images: require explicit `width`/`height` or `fill`.
- Configure remote domains in `next.config.js` via `remotePatterns`.
- Use `sizes` prop with `fill` to prevent oversized downloads.
- Use `priority` prop for above-the-fold images (improves LCP).
- Static exports: require `unoptimized` flag or custom image loader.

## Suspense Boundaries
| Hook | Suspense Required |
|---|---|
| `useSearchParams()` | Yes (always in static routes) |
| `usePathname()` | Yes (dynamic routes) |
| `useParams()` | No |
| `useRouter()` | No |

Without Suspense, `useSearchParams()` causes the entire page to become CSR.

## Hydration Errors
Common causes and fixes:
- **Browser-only APIs** (`window`, `localStorage`) — use Client Component with `useEffect` mounted check.
- **Date/time rendering** — render on client only via `useState` + `useEffect`.
- **Random values/IDs** — use `useId()` hook instead of `Math.random()`.
- **Invalid HTML nesting** — e.g. `<div>` inside `<p>`, `<p>` inside `<p>`.
- **Third-party scripts modifying DOM** — use `next/script` with `strategy="afterInteractive"`.
