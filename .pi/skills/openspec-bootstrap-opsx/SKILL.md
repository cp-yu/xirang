---
name: "openspec-bootstrap-opsx"
description: "Bootstrap OPSX architecture map from existing codebase using a structured five-phase workflow (init → scan → map → review → promote)."
license: "MIT"
compatibility: "Requires openspec CLI."
metadata:
  author: "openspec"
  version: "2.0"
  generatedBy: "1.4.1-cpyu.1"
---

Bootstrap the OPSX architecture map from the existing codebase.

**OPSX Compilation Philosophy**:
OpenSpec treats human intent → running code as a compilation pipeline. Specs + OPSX are the durable semantic source: Specs define observable behavior; OPSX is the architecture symbol table and module graph. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding and MUST NOT override Specs or OPSX. change-local specs and `opsx-delta.yaml` are semantic source deltas that express the target steady state; a change is the reconciliation unit. the agent is the compiler; `openspec validate` is static analysis; verify Phase 1 is the semantic-check pass; verify Phase 2 is the optimization pass; sync + archive is linking and release; snack is limited decompilation. Rules that follow:
1. Source MUST be elegant: every sentence is consumed downstream; redundant restatement is a code smell — state each fact exactly once.
2. Source completeness: key undefined decisions that change behavior or architecture return to the relevant Specs or OPSX. Make them explicit; Never guess silently.
3. Faithful translation: a compiler MUST NOT invent instructions or exceed the declared source.
4. Definition-first authoring: read the resolved `definition` (the resolved file definition), then dependencies/current state, then `instruction` and `template`; apply its content boundary and write policy. MUST NOT copy definitions, context, rules, projections, or reasoning into artifacts.
5. Syntax is contract: preserve canonical headings, IDs, schema keys, normative keywords, paths, and commands.
6. No dead-code output: no placeholders, empty sections, or repeated narration.
7. Not compiled until gates pass: validate/verify/seal are required pipeline stages.
A single compilation is faithful and deterministic; OpenSpec source iterates freely and recompiles fast.

This is a **structured, multi-phase** workflow. Each phase produces intermediate artifacts in `openspec/bootstrap/` before writing formal OPSX files.

Treat `openspec/config.yaml` as the source of truth for authoring policy, but consume its compiled projection semantics: prose-bearing bootstrap artifacts follow the projected documentation language policy, while canonical headings, IDs, schema keys, paths, and commands stay unchanged.

**Input**: No argument required. Scope hints (folders, domain names) are passed to init.

**Steps**

1. **Determine current phase**
   ```bash
   openspec bootstrap status --json
   ```
   - If no workspace exists, start with init
   - If workspace exists and is in progress, resume from the current phase
   - If workspace exists and is completed, restart explicitly with `openspec bootstrap init --mode refresh --restart`; omitted `--granularity` inherits retained `scope.yaml`

2. **Execute the current phase**

   Get phase-specific instructions:
   ```bash
   openspec bootstrap instructions [phase] --json
   ```
   Read the returned `fileDefinitions` before the phase instruction. Directly edit only files whose `writePolicy` permits Agent authoring, and MUST NOT copy definitions into those files.

   **Phase: init**
   
   **Before init**: Ask the user to choose a spec granularity:
   - **coarse** — fewer, wider grouped specs via `spec_groups` in domain-map source
   - **fine** — per-capability specs via `capabilities[].spec`
   
   Do NOT pick a default. Explain the trade-off: coarse produces fewer spec files covering multiple capabilities each; fine produces one spec per capability.

   ```bash
   openspec bootstrap init --mode full --granularity coarse
   ```
   The CLI persists the confirmed granularity in `scope.yaml`. Initial init requires `--granularity`; a completed workspace restart inherits retained granularity when the option is omitted, while an explicit value overrides it. Invalid values fail fast.
   Creates workspace at `openspec/bootstrap/` with scope configuration.
   Supported upgrade paths:
   - `specs-based -> full`
   - `raw -> full`
   - `raw -> opsx-first`
   - `formal-opsx -> refresh`
   Use `opsx-first` only for `raw` repositories when you want the formal OPSX bundle plus a README-only specs starter now, and full behavior specs later.
   Use `refresh` only for repositories that already have both formal OPSX v2 files. Rebuild a complete candidate from current evidence, use the existing bundle only for review diff, then atomically replace the two formal files after approval.
   Use `--restart` only when a completed retained workspace already exists and you want a fresh run; it snapshots the old `openspec/bootstrap/` into `openspec/bootstrap-history/` first. Omit `--granularity` to inherit retained `scope.yaml`, or pass it explicitly to override the retained value.
   After init, use the public, auditable transition before scanning:
   ```bash
   openspec bootstrap advance scan
   ```
   Confirm `openspec bootstrap status --json` reports `phase: scan`. Do not edit `.bootstrap.yaml` or call an internal API to advance the phase.

   **Phase: scan**
   - Read `package.json`, `README`, OpenSpec config, `openspec/specs/`
   - Scan source code for structural boundaries
   - Write `openspec/bootstrap/evidence.yaml` with candidate domains:
     ```yaml
     domains:
       - id: dom.cli
         confidence: high
         sources: [code:src/cli/, spec:openspec/specs/cli/]
         intent: CLI entry point and command routing
   ```
   - Run `openspec bootstrap validate` to verify gates
   - In `refresh`, scan all current source, specs, configuration, and reviewed workspace evidence; use the existing formal OPSX v2 bundle only for the later review diff

   **Phase: map**
   - For each domain in evidence.yaml, create `openspec/bootstrap/domain-map/<domain-id>.yaml`:
     ```yaml
     domain:
       id: dom.cli
       type: domain
       intent: CLI entry point and command routing
       status: active
     capabilities:
       - id: cap.cli.init
         type: capability
         intent: Initialize OpenSpec in a project
         status: active
         spec:
           folder: cli-init
           purpose: ...
           requirements:
             - title: ...
               text: The system SHALL ...
               scenarios: ...
     spec_groups:  # For coarse granularity only
       - folder: cli
         capabilities: [cap.cli.init, cap.cli.validate]
         purpose: CLI commands expose OpenSpec workflows through deterministic behavior.
         requirements:
           - title: ...
             text: The system SHALL ...
             scenarios: ...
     relations:
       - from: cap.cli.init
         type: belongs_to
         to: dom.cli
     ```
   - Map one domain at a time, but derive every entry from the complete current scan
   - Run `openspec bootstrap status` to track per-domain progress
   - Run `openspec bootstrap validate` after all domains mapped

   **Phase: review**
   - Validate regenerates review.md and candidate OPSX files from current `evidence.yaml` and `domain-map/*.yaml`
   - Review each domain checkbox in review.md
   - In `refresh`, review the complete candidate and its diff against the old formal model, which is review evidence only
   - Check all validation checkboxes
   - If evidence or domain maps change, rerun validate and re-approve the regenerated review
   - Low-confidence domains appear first for priority review

   **Phase: promote**
   ```bash
   openspec bootstrap promote -y
   ```
   Re-validates all upstream gates before writing.
   - `opsx-first`: writes the formal OPSX two-file bundle plus only `openspec/specs/README.md`
   - `full` on `raw` with `granularity: coarse`: writes the formal OPSX bundle plus grouped specs from `spec_groups` with multi-capability frontmatter
   - `full` on `raw` with `granularity: fine`: writes the formal OPSX bundle plus one spec per mapped capability
   - `full` on `specs-based`: preserves existing specs, adds only missing capability specs, and fails fast on target-path conflicts
   - `refresh` on `formal-opsx`: rebuilds the complete candidate from current evidence, uses the old model only for review diff, then replaces both formal files
   Promote also runs the programmatic spec frontmatter backfill. After promote, run:
   ```bash
   openspec bootstrap backfill-specs --json
   ```
   The JSON `semanticHandoff` contains each unmatched spec's content/path, candidate capability IDs and intents, the exact mapping result format, and the apply command. Give that context to a subagent; it MUST return only evidence-backed mappings and MUST leave uncertain specs unmapped. Save the reviewed result, then run `openspec bootstrap backfill-specs --mappings <mapping-file> --json`. Report the returned `unmatched` list explicitly; never guess or silently associate capabilities.
   Retains the bootstrap workspace on success for audit history.
   After promote + backfill, run:
   ```bash
   openspec validate --all
   ```
   If validation fails, report the failing item and return to the relevant bootstrap source artifact for repair. Do NOT claim bootstrap completion while validation failures remain unresolved.
   Start the next refresh run with `openspec bootstrap init --mode refresh --restart`, which snapshots the retained workspace into `openspec/bootstrap-history/` and inherits its granularity. Pass `--granularity coarse|fine` only to override the retained value.

3. **After each phase action**
   - Run `openspec bootstrap validate` to verify gate conditions
   - Run `openspec bootstrap status` to confirm phase advancement
   - Continue to next phase

**Evidence Guidelines**
- Use repository evidence only — do not fabricate
- Attach confidence levels: high (multiple sources), medium (single source), low (inferred)
- Prefer fewer domains with solid evidence over exhaustive noise
- Each domain should map to a clear architectural boundary

**Mapping Guidelines**
- Capability IDs follow `cap.<domain>.<action>` convention
- Use optional CodeGraph or ACE/`rg`/`read` for current code evidence; do not persist code paths in OPSX
- Relations follow this Registry projection:
- `belongs_to` (capability → domain): 记录 capability 的架构所有权。
- `invokes` (caller → callee): 一个 capability 在运行时主动调用另一个 capability。
- `consumes` (consumer → provider): 交互核心是读取或依赖提供内容。
- `precedes` (earlier → later): 执行顺序是正确性合同。
- `constrains` (constraint owner → constrained capability): 存在独立且稳定的行为约束。
- `validates` (validator → subject): 交互结果是明确的有效性判定。
- Do not promote import/call evidence mechanically; mark uncertain mappings as review gaps

**Guardrails**
- Do NOT write directly to formal OPSX files — use the bootstrap workspace
- Do NOT promote import/call evidence without a precise Registry relation; record a `review_gaps` entry instead
- Do NOT skip the review phase
- Do NOT treat stale review.md checkboxes as approval after evidence or mappings change
- Keep the graph small enough to audit in one sitting
