# G-106 — Make Relay memo SVGs safe for byte-preserving publication

Status: completed
Priority: P0 cross-repository producer regression
Owner: Relay
Source: Website `_IDEAS/website-relay-contract.md` (2026-07-21 handoff)

## Outcome

Relay's canonical memo source can be copied byte-for-byte into Website and
rendered by Astro/CommonMark without exposing SVG markup as reader-facing text.
Every inline memo diagram remains one uninterrupted raw-HTML figure, and the
Relay producer gate rejects the whitespace pattern that caused the production
incident before Website can ingest it.

## Customer-visible problem

The first five Relay Packs memos contain blank lines inside
`<figure class="fn-diagram">...</figure>`. CommonMark ends a raw-HTML block at a
blank line. A blank line immediately after `</defs>` therefore lets later SVG
geometry render as a plaintext code block even though the extracted SVG is
valid XML and passes Relay's current SVG checks.

Website has released a last-known-good containment copy. That copy is not the
source of truth and must not be copied back into Relay. Relay owns the canonical
repair; Website continues to own fail-closed ingestion and public rendering.

## Affected canonical source

- `_ASSETS/memos/why-relay-packs/article.md`
- `_ASSETS/memos/web-designer-pack/article.md`
- `_ASSETS/memos/agency-bundle/article.md`
- `_ASSETS/memos/marketing-line/article.md`
- `_ASSETS/memos/industry-verticals/article.md`
- `_ASSETS/memos/scripts/verify-svg.mjs`
- the smallest reliable verifier fixture/test surface under `_ASSETS/memos/`

## Specification

### CommonMark raw-HTML boundary

For every complete `<figure class="fn-diagram" ...>...</figure>` span in a memo
article:

- there is no blank line between the opening and closing figure tags;
- a blank line means two newline sequences separated only by horizontal
  whitespace, with LF and CRLF both covered;
- the error names the article, figure number, and `raw-HTML boundary` so an
  author can distinguish Markdown breakage from SVG geometry or design-system
  failures;
- missing or unbalanced figure/SVG tags fail visibly rather than causing the
  verifier to inspect a partial substring; and
- the boundary check runs on article source before individual SVG substrings
  are extracted.

The gate retains the existing SVG design invariants and also proves that IDs are
unique within an article and every `url(#id)` reference resolves within the SVG
that uses it. A reference must not resolve accidentally through another figure.

### Canonical repair

Remove blank lines only inside the five affected `fn-diagram` figures. Preserve
all prose, captions, SVG elements, geometry, accessibility labels, design
tokens, IDs, animation, and frontmatter. Formatting outside those figures is
out of scope.

### Regression contract

Add deterministic fixtures or an exported verifier unit surface covering at
least:

1. `</defs>`, a blank line, then a geometry node — rejected with a named
   raw-HTML-boundary failure;
2. the equivalent uninterrupted figure — accepted;
3. a whitespace-only blank line and CRLF input — rejected;
4. a missing closing figure or SVG tag — rejected;
5. duplicate IDs in one article — rejected;
6. `url(#missing)` and a reference that exists only in another SVG — rejected;
7. the five repaired articles — accepted by the same production gate.

The regression must invoke the actual production verifier logic. A test that
reimplements the regex separately is not sufficient.

## Implementation plan

1. Refactor the minimum source-validation logic in `verify-svg.mjs` into
   testable functions or add a fixture-driving CLI mode without weakening its
   existing command contract.
2. Validate complete `fn-diagram` spans and CommonMark boundaries before
   calling the existing SVG extractor.
3. Add the negative and positive regression fixtures, then demonstrate that
   the negative fixture fails before repairing the articles.
4. Remove internal blank lines from the five affected canonical figures only.
5. Run each affected article gate and the complete memo aggregate, scrub,
   design-system-drift, claim, and SVG validations.
6. Record the Relay source commit and exact passing commands in Website's
   `_IDEAS/website-relay-contract.md` handoff ledger. Do not edit Website memo
   copies or bypass its fail-closed consumer gate.

## Acceptance criteria

- All five canonical articles contain zero blank lines inside every
  `fn-diagram` figure.
- The production verifier rejects the known incident fixture with an explicit
  raw-HTML-boundary error and accepts its uninterrupted equivalent.
- Unbalanced tags, duplicate IDs, and unresolved/locality-violating URL
  references have named failures.
- Existing SVG accessibility, token, z-order, animation, claim-trace,
  screenshot, privacy/scrub, and design-system gates remain green.
- `verify-all-memos.mjs` passes the complete corpus, not only the five repaired
  slugs.
- The Website coordination contract records Relay's immutable source commit and
  verification receipt before Website accepts a new byte-preserving sync.
- No Website source, public route, deployment, or public copy is changed by this
  Relay goal.

## Verification budget

- Targeted verifier fixture suite for raw-HTML boundaries, tag balance, ID
  uniqueness, and same-SVG URL resolution.
- `verify-article.mjs` for each of the five affected slugs.
- `verify-all-memos.mjs` across the complete corpus with design-system drift
  enabled.
- Explicit searches proving no blank line remains inside an inline diagram and
  no unrelated article content changed.
- Fresh diff review of the canonical article repairs and verifier failure text.

Website's rendered-output and light/dark browser smoke remain Website-owned
consumer acceptance after it performs a newly accepted byte-preserving sync.

## Constraints and non-goals

- Relay `_ASSETS` remains the sole canonical source; Website does not repair it.
- Do not replace inline SVG, change the Markdown engine, or normalize whole
  articles to solve a bounded source-format defect.
- Do not make the Website sync non-byte-preserving.
- Do not publish, deploy, or overwrite Website's last-known-good containment as
  part of this goal.
- Preserve all unrelated operator and agent changes in Relay and Strategy.

## Operator gates

None for local Relay implementation, deterministic verification, the Relay
commit, or recording its evidence in the co-owned contract. Website sync,
Website commit/push/deploy, and any public release remain separately gated by
Website's workflow and the operator.

## Stop and rescue

If two materially different source-safe approaches fail the same CommonMark
boundary case, or the repair requires changing diagram semantics, stop with the
smallest failing fixture and exact renderer/verifier evidence. Keep Website's
last-known-good containment in place and do not relax byte equality, skip the
producer gate, or promote a Website-local hotfix to canonical source.

## Completion receipt — 2026-07-30

- Canonical Strategy source commit: `996a408`.
- `node --test scripts/__tests__/verify-svg.test.mjs`: 7/7 passed.
- Each affected `verify-article.mjs` gate passed.
- `node scripts/verify-all-memos.mjs`: all 11 memos passed the design-system,
  source-contract, article, SVG, claim-trace, screenshot, and scrub gates.
- Website coordination evidence is recorded in
  `_IDEAS/website-relay-contract.md`. Website sync, rendered browser acceptance,
  commit, push, deploy, and publication remain Website-owned and separately
  gated.
