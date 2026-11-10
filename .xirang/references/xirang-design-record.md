# Design Record Protocol

Design Record is the shared method Build, Explore, and Propose use to maintain the current design and its decision basis. Entries may be pending, accepted, or excluded; an entry is not itself a confirmed obligation. Normative confirmations MUST reach the record before handoff unless the user explicitly grants an exemption. A record may hold only part of the design, and no record is needed to start discussion. Structure formation belongs to the configured decomposition guidance, not to this protocol. This protocol owns recording, conflict handling, reload, the record decision, writing rules, the coverage gate, and handoff.

## Inputs and authority

- Load the Semantic Model, user-authorized scope, project evidence, and any current record. An absent formal model is valid for initial Build; a damaged existing model is an error, never an empty starting point.
- Run `xirang record list --json`. If a relevant record exists, select it by its contained filename. Build and Change use independent instances; never reuse a record across contexts.
- At first takeover, after context loss, before Summary and before closing coverage, run `xirang record show <filename> --json` and read the complete latest record. Never reconstruct missing detail from conversation or Summary.
- During a phase, read only needed entries: `xirang record show <filename> --entry A --entry C --json`. Reuse known content. Unknown entry identities remain errors.
- Use `record status` for relevant model drift and `record validate` when format or references are uncertain. Do not routinely run show/status/validate together. Reconcile relevant drift and unknown details before relying on affected conclusions.
- The CLI checks format, identity, paths, structure references, and explicit related context. `semanticCoverage: not-evaluated` is not approval. Agents assess natural-language conflicts and coverage; users decide unresolved intent. Treat relevant drift as a re-review gate: distinguish authorized evolution from unresolved contradictions and resolve them before continuing. Records require `schemaVersion: 4` and explicit `nature` and `decision` on every entry. Older formats or missing states are unsupported: never default to accepted, migrate, delete, or create a compatibility copy. Leave the source unchanged and report the diagnostic for user handling.

## User-facing record presentation

Build, Explore, and Propose SHALL apply these presentation rules after reading the shared record:

- On the first complete load in a new conversation, present a concise natural-language baseline of all accepted and excluded design decisions and confirmed structure, plus every pending question or assumption. Summarize the content rather than reproducing entries. Do not announce successful loading or expose the record filename, valid status, or mechanical counts.
- In the same conversation, an ordinary reload does not repeat the full baseline. After a record write, report only the content added, changed, removed, or reclassified by that write; separately identify modifications to confirmed content. Do not repeat unchanged content or report mechanical counts.
- If load, status, or validation reports invalid data, relevant drift, or a context conflict, tell the user what is inconsistent and what reconciliation is needed. Do not stay silent or present a bare version.
- With no applicable record, do not announce a successful load. Do not emit mechanical CLI receipts.

The conversation baseline is presentation state, not durable record state. After context loss or when the Agent cannot establish that the current record baseline was already presented in this conversation, reload and present it before relying on the record.

## Record on confirmation

A user's design confirmation authorizes recording that content. Record it right after the user confirms a design section. Do not ask for a separate persistence confirmation, and do not show the complete proposed record before writing. Build, Explore, and Propose may proactively capture and maintain questions, assumptions, and recommendations as `pending`. Only the user's decision permits `accepted` or `excluded`; an experiment succeeding establishes evidence, not adoption. Obtain user permission before substantively revising, deleting, or changing the decision state of accepted or excluded content, or revising confirmed structure fields, including withdrawal. Do not first downgrade confirmed content to pending to bypass that permission. Agent derivations must not be labeled as user confirmations. With no record, the first design content needing preservation may create a nonempty record; an empty record list is a starting state, not an exemption.

After each write, report only this write's content delta and decision-state changes; separately flag every modification of already-confirmed content. Do not re-present unchanged content or announce mechanical counts. When a new statement conflicts with recorded content, explain the conflict and its impact and let the user rule; MUST NOT treat the latest statement as overriding earlier confirmation. After the ruling, write the result.

## Entry writing standard

Each entry has stable `identity`, `nature` (`normative` or `informative`), `decision` (`pending`, `accepted`, or `excluded`), and free-text `content`. Nature and decision are independent. Pending entries preserve the question, assumption, or recommendation; accepted normative entries must pass this test: Could a downstream author write the Contract and Acceptance Cases from this entry without the conversation? Keep confirmed conditions, numbers, exceptions, timing, and the positive and negative examples used to align. Record user examples verbatim; do not rewrite them into a general rule. For example, keep "When the current profile is A and C, events ABC and ACD qualify; event AB does not (missing C)" instead of only "tags must be covered". Rationale and experiment observations are `informative`, not obligations; do not infer acceptance from a successful experiment. Keep only the necessary content and reasons for excluded alternatives, not the full discussion transcript. Material the user asks to record takes precedence over the Agent's importance filter. Keep details in multiline content, without fixed examples, counterexamples, or timing subfields.

Confirmed component structure goes into `structure`, not only into entry text. Inclusion confirms the object and the fields supplied. Keep an unconfirmed parent, kind, or other structural proposal in a pending entry as free text until the user confirms it; do not create a second identity scheme or require a complete target model. `structure` states the confirmed target state in Semantic Model shape, keyed by semantic identity: `elements` (`kind`, `parent`, `title`, `definition`), `relationships` (`source`, `kind`, `target`), `elementKinds` (`contract`, `contractFormat`, `root`, `parents`, `children`), and `relationshipKinds` (`sourceKinds`, `targetKinds`). Record only confirmed fields; a partial declaration is valid. `removed: true` states a confirmed deletion; an unmentioned object is unconfirmed, not deleted. `parent: null` means Project Root. The CLI derives added, modified, removed, or unchanged against the current model; do not write Delta operations into the record.

```yaml
schemaVersion: 4
context: change
relatedIdentities: [service]
entries:
  - identity: retry-window
    nature: normative
    decision: accepted
    content: |
      Retry at most 3 times within 30 seconds, except after cancellation.
      Example the user confirmed: a cancelled request at second 10 is not retried.
  - identity: retry-rationale
    nature: informative
    decision: excluded
    content: The user rejected unbounded retries because they could outlive cancellation.
  - identity: candidate-parent
    nature: normative
    decision: pending
    content: Should the unrelated reporting Element belong under analytics?
  - identity: report-export
    nature: normative
    decision: accepted
    content: The separate reporting change must export CSV.
structure:
  elements:
    - identity: retry-policy
      kind: capability
      parent: service
  relationships:
    - { source: retry-policy, kind: depends-on, target: clock }
    - { source: service, kind: depends-on, target: legacy-queue, removed: true }
```

Use `context: build` for a separate Build instance, including before Candidate init. `relatedIdentities` adds explicit context hints beyond the identities `structure` already references. Entry identities stay stable through revisions; the filename is the record identity.

## Write protocol

Build, Explore, and Propose share this record maintenance protocol. Create or update pending content proactively; accepted/excluded decisions and substantive revisions to confirmed content require the user's permission as above. A small record revision does not require returning from Propose to Explore. Return to Explore when the proposal needs feasibility experiments, a direction choice reconsidered through experimentation, or substantial redesign. Record maintenance never authorizes formal model, implementation, or unrelated project writes.

1. Create with the complete first content on stdin: `xirang record create <filename> --json`.
2. Update with only this write's changes on stdin: `xirang record update <filename> --json`. The patch holds `entries.upsert` / `entries.remove`, `structure.upsert.<type>` (fields merge; list fields to drop under `clear`), `structure.withdraw.<type>` (object returns to unconfirmed; distinct from `removed: true`), and `relatedIdentities.add` / `remove`. Each upsert supplies the complete entry target, including `identity`, `nature`, `decision`, and `content`; removals use identity. Unmentioned entries and objects stay unchanged. `parent: null` sets Project Root, not a cleared field.
3. Agent writes MUST use `xirang record` structured operations; do not directly edit managed Record files. Successful updates are silent. Add `--diff` only when differences are needed to verify a complex change.
4. When differences are requested, compare entry before/after and structure added, changed, cleared or withdrawn fields with intent. An unintended change requires reconciliation. Report only the content changed, separately flagging revisions to confirmed content.
5. Use `xirang record rename <filename> <new-filename> --json` or `xirang record discard <filename> --json` only with explicit user authorization for that action.

When a record changes, inspect known related entries for present-tense assertions about the changed decision, using selective CLI reads when needed. In pending entries, reconcile only stale dependent status text through a partial CLI update; preserve experiment inputs, observed results, limitations, and statements that describe a past state. Do not change an entry's decision merely because a related entry was accepted or excluded. Substantive revisions of accepted or excluded content still require user permission under Record on confirmation. Then invalidate affected design, Summary, and coverage conclusions and recheck them; keep unrelated entries and conclusions intact.

## Record decision and Summary gate

When the confirmed design contains at least one normative confirmation, confirm exactly one record decision before handoff: a record, an explicit user-granted exemption, or a statement that the design carries no normative content. Never end formation with normative confirmations and none of the three. An exemption is user-granted, deliberate, and recorded; do not offer exemption as the default. Record the exemption and its reason in the Design Summary (Explore) or `build.md` (Build) and carry it into provenance. A silent skip is never an exemption, and no empty record is created. Re-open the decision when later confirmations add normative content.

Before Explore outputs a Design Summary, reload the complete latest record and compare it with the confirmed conversation: every normative confirmation must be recorded or explicitly exempted; a valid partial record does not prove capture is complete. Record missing confirmations first, reload, and check internal conflicts, conflicts with the proposed design, and pending questions affecting the current target. Unresolved conflicts or target-affecting pending decisions block Design Summary. Resolve them with the user, save the ruling, and recheck affected conclusions. When record-backed, the Summary MUST carry `filename` for Propose to rediscover the source, not a copy of the record or `sourceVersion`. A later record change invalidates affected Summary conclusions until rechecked. Propose must also obtain an undeclared record decision before compiling; a missing decision is not an implicit exemption and does not itself require returning to Explore.

## Writing rules

Compile only accepted normative content applicable to the current target into commitments. Write confirmed examples as Acceptance Cases when compiling from a record (a Key Acceptance Case in business-specification Contracts, a concrete case in the host Section otherwise), verbatim or in an equally concrete form with the same inputs and outcomes. Keep A and C with events ABC, ACD, and AB and their results; a generic "all tags versus some tags" case is not equivalent. Do not generalize numbers, timing, or exceptions; state them in the host Contract's business logic or exception handling. If the confirmed per-source candidate limit K is configurable with default 32, write default 32, not just "a configurable limit". Compile each confirmed `structure` object into the matching Delta or Candidate entry, or leave it as a no-op when the target already matches. Pending suggestions do not become settled design. Excluded alternatives and informative entries retain necessary reasons or evidence in Plan, `build.md`, or provenance; do not invent Contract obligations for them.

## Coverage gate

Before closing coverage, reload the complete latest record and check it against the complete target model: the Change's Expected Semantic Model, or the active Candidate. Classify by nature, decision, and applicability to this target:
- For each accepted normative entry requiring implementation in this target, submit `result: covered` and nonempty `details`. Split it into atomic details: conditions, numbers, examples, counterexamples, timing, exceptions. Give each detail one exact location: an Element identity plus its Declaration, a Section, or an Acceptance Case in that Section; or a Relationship, Element Kind, Relationship Kind, or Authored View. For an Element location, add a `quote`: the excerpt at that location that carries the detail, copied from the current target file, never from memory or paraphrased. If the excerpt states only a general rule without the example's concrete inputs and outcomes, the example is uncovered. Unchanged current semantics may serve as a no-op location. A rule placed without its aligning example leaves the example uncovered: an example without a location counts as uncovered.
- For an accepted normative entry outside the current target, submit `result: not-applicable` and a nonempty `reason`. Judge the reason against the confirmed scope; this declaration must not evade an accepted commitment.
- For every pending entry, submit `result: pending` with `affectsTarget`. `true` blocks handoff until resolved; `false` requires a nonempty `reason`. This check also applies to informative pending entries; evidence alone does not resolve a pending design decision.
- Excluded entries and non-pending informative entries require no target commitment locations. Read their necessary context and retain it in Plan or provenance; do not force them into Contracts.
A summary claim such as "checked item by item" is not a coverage result.

Submit the result as JSON through `xirang record coverage <filename> (--change "<name>" | --candidate) --from <file> --json`:

```json
{ "entries": [
  { "identity": "retry-window", "result": "covered", "details": [
    { "detail": "at most 3 retries", "location": { "element": "retry-policy", "section": "Business Logic" }, "quote": "Retry at most 3 times within 30 seconds, except after cancellation." },
    { "detail": "within 30 seconds", "location": { "element": "retry-policy", "section": "Business Logic" }, "quote": "Retry at most 3 times within 30 seconds, except after cancellation." },
    { "detail": "no retry after cancellation", "location": { "element": "retry-policy", "section": "Business Logic" }, "quote": "Retry at most 3 times within 30 seconds, except after cancellation." },
    { "detail": "cancelled at second 10 is not retried", "location": { "element": "retry-policy", "section": "Key Acceptance Cases", "acceptanceCase": "Cancelled request is not retried" }, "quote": "a request cancelled at second 10 is not retried" }
  ] },
  { "identity": "candidate-parent", "result": "pending", "affectsTarget": false, "reason": "The reporting hierarchy is outside this retry-policy target and has no dependency on its behavior." },
  { "identity": "report-export", "result": "not-applicable", "reason": "The accepted CSV obligation belongs to the separate reporting change; this target covers retry-policy only." }
] }
```

The CLI rejects unknown entries, missing required results, result types inconsistent with nature or decision, empty or uncovered details, a location absent from the target, a missing quote or one that does not appear at its location (whitespace and Markdown emphasis are ignored), not-applicable results without a reason, and pending results that affect the target or omit the required reason when they do not. For a Change, it also compares the record's `structure` with the Expected Semantic Model field by field before writing coverage; Candidate structure remains checked at consume. A rejected submission records nothing. Resolve a pending decision with the user, correct an unsupported classification, or write a missing accepted detail into the target as appropriate; then recheck and resubmit. The CLI proves the check ran, each location exists, and each quote appears there, not that the quote expresses the detail or that the user authorized it; the semantic judgment remains the checker's. The `structure` part is not split into details. The CLI internally binds exact source bytes and target-model fingerprint; callers do not supply or copy hashes or versions. Any source change invalidates it. Any target-model change requires renewed coverage; Plan-only edits do not change that fingerprint. An exempted or normative-free source with no record has no entries to check; state that explicitly and skip coverage and consumption. If a record exists, still classify its pending entries and perform the applicable handoff gates.

## Output and handoff

Consumers explicitly select the named Change or active Candidate; never infer a target from cwd. For a Change, run coverage while the record is active and before asking the user to accept the final Change; update the record and target as needed during review and repeat coverage after either changes. Only after the user accepts the final Change may Propose consume its record. For a Candidate, follow its Build review and promotion gates. After coverage is recorded and applicable validation passes, run `xirang record consume <filename> (--change "<name>" | --candidate) --json`. Consume rejects missing or stale coverage (source version or target changed since recording) and any field-level `structure` mismatch, including a `removed: true` object that still exists; it does not rerun coverage. On success it copies exact bytes to `record-source.md` beside `record-coverage.json`, revalidates, and deletes the active record. Failure preserves the source and existing destination; identical snapshots may resume after revalidation, conflicting snapshots must stop. Verify the target snapshots and source cleanup before reporting handoff complete. Both files are formation history, not a second normative model or Delta, and never enter formal partitions.