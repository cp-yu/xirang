# Design Record Protocol

Design Record is the shared method Build and Explore use to record the user's confirmed intent as the design is confirmed, and the source Propose and Build compile from. It is required whenever the confirmed design contains a normative confirmation: that confirmation MUST reach the record before handoff. A record may hold only part of the design, and no record is needed to start discussion. Structure formation belongs to the configured decomposition guidance, not to this protocol. This protocol owns recording, conflict handling, reload, the record decision, writing rules, the coverage gate, and handoff.

## Inputs and authority

- Load the Semantic Model, user-authorized scope, project evidence, and any current record. An absent formal model is valid for initial Build; a damaged existing model is an error, never an empty starting point.
- Run `xirang record list --json`. If a relevant record exists, select it by immutable `explorationId`, not slug or path. Build and Change use independent instances; never reuse a record across contexts.
- For a selected record, before resuming, compiling from it, or handing it off, run `xirang record show <explorationId> --json`, `xirang record status <explorationId> --json`, and `xirang record validate <explorationId> --json`. Read the complete current record and retain `sourceVersion`. Never reconstruct a record from recent conversation or Summary.
- The CLI checks format, identity, paths, versions, structure references, and explicit related context. `semanticCoverage: not-evaluated` is not approval. Agents assess natural-language conflicts and coverage; users decide unresolved intent. Treat relevant drift as a re-review gate: distinguish authorized evolution from unresolved contradictions and resolve them before continuing. Older record formats are unsupported and require user handling; do not migrate or delete them automatically.

## Record on confirmation

A user's design confirmation authorizes recording that content. Record it right after the user confirms a design section. Do not ask for a separate persistence confirmation, and do not show the complete proposed record before writing. Record only what the user explicitly confirmed; recommendations, derivations, and undecided options stay out until the user confirms them. With no record, the first confirmation creates it: an empty record list is a starting state, not an exemption.

After each write, report only this write's changes and the record summary returned by the CLI; do not re-present unchanged content. Flag every modification of already-confirmed content (changed entry, changed field) separately from additions. When a new statement conflicts with recorded content, explain the conflict and its impact and let the user rule; MUST NOT treat the latest statement as overriding earlier confirmation. After the ruling, write the result.

## Entry writing standard

Test every entry: Could a downstream author write the Contract and Acceptance Cases from this entry without the conversation? Keep confirmed conditions, numbers, exceptions, timing, and the positive and negative examples used to align. Record user examples verbatim; do not rewrite them into a general rule. For example, keep "When the current profile is A and C, events ABC and ACD qualify; event AB does not (missing C)" instead of only "tags must be covered". Discussion, rejected alternatives, and rationale are not recorded unless the user asks; then record them as `informative`, never as obligations. Material the user asks to record takes precedence over the Agent's importance filter.

Confirmed component structure goes into `structure`, not only into entry text. `structure` states the confirmed target state in Semantic Model shape, keyed by semantic identity: `elements` (`kind`, `parent`, `title`, `definition`), `relationships` (`source`, `kind`, `target`), `elementKinds` (`contract`, `contractFormat`, `root`, `parents`, `children`), and `relationshipKinds` (`sourceKinds`, `targetKinds`). Record only confirmed fields; a partial declaration is valid. `removed: true` states a confirmed deletion; an unmentioned object is unconfirmed, not deleted. `parent: null` means Project Root. The CLI derives added, modified, removed, or unchanged against the current model; do not write Delta operations into the record.

```yaml
schemaVersion: 3
context: change
relatedIdentities: [service]
entries:
  - identity: retry-window
    nature: normative
    content: |
      Retry at most 3 times within 30 seconds, except after cancellation.
      Example the user confirmed: a cancelled request at second 10 is not retried.
  - identity: retry-rationale
    nature: informative
    content: The user asked to keep the rejected unbounded-retry alternative for context.
structure:
  elements:
    - identity: retry-policy
      kind: capability
      parent: service
  relationships:
    - { source: retry-policy, kind: depends-on, target: clock }
    - { source: service, kind: depends-on, target: legacy-queue, removed: true }
```

Use `context: build` for a separate Build instance, including before Candidate init. `relatedIdentities` adds explicit context hints beyond the identities `structure` already references. Entry identities stay stable through revisions; slug changes do not change record identity.

## Write protocol

The calling workflow must permit the operation: Build and Explore write records; Propose MUST NOT create, update, rename, or discard records, and a needed revision returns to Explore. This protocol never expands stage permissions.

1. Create with the complete first content on stdin: `xirang record create --slug <slug> --json`.
2. Update with only this write's changes on stdin and the current version: `xirang record update <explorationId> --source-version <sourceVersion> --json`. The patch holds `entries.upsert` / `entries.remove`, `structure.upsert.<type>` (fields merge; list fields to drop under `clear`), `structure.withdraw.<type>` (object returns to unconfirmed; distinct from `removed: true`), and `relatedIdentities.add` / `remove`. Unmentioned entries and objects stay unchanged.
3. A stale `--source-version` is rejected with the current version: reload with `xirang record show`, reconcile, and resubmit. Never guess.
4. Check the returned `diff` (entry before/after, structure changed/added/cleared fields), `derived`, and `summary` against what you meant to write. An unintended change is a context-amnesia signal: stop and reconcile with the user. Report the delta and summary as described above.
5. Use `xirang record rename <explorationId> --slug <slug> --json` or `xirang record discard <explorationId> --json` only with explicit user authorization for that action.

When a record changes, invalidate affected design, Summary, and coverage conclusions and recheck them; keep unrelated conclusions intact.

## Record decision and Summary gate

When the confirmed design contains at least one normative confirmation, confirm exactly one record decision before handoff: a record, an explicit user-granted exemption, or a statement that the design carries no normative content. Never end formation with normative confirmations and none of the three. An exemption is user-granted, deliberate, and recorded; do not offer exemption as the default. Record the exemption and its reason in the Design Summary (Explore) or `build.md` (Build) and carry it into provenance. A silent skip is never an exemption, and no empty record is created. Re-open the decision when later confirmations add normative content.

Before Explore outputs a Design Summary, compare the confirmed conversation with the current record: every normative confirmation must be recorded or explicitly exempted; a valid partial record does not prove capture is complete. Record missing confirmations first, reload, and check internal conflicts and conflicts with the design. Unresolved conflicts block Design Summary. When record-backed, the Summary MUST carry `explorationId` and the checked `sourceVersion`, not a copy of the record.

## Writing rules

Write confirmed examples as Acceptance Cases when compiling from a record (a Key Acceptance Case in business-specification Contracts, a concrete case in the host Section otherwise), verbatim or in an equally concrete form with the same inputs and outcomes. Do not generalize numbers, timing, or exceptions; state them in the host Contract's business logic or exception handling. Compile each `structure` object into the matching Delta or Candidate entry, or leave it as a no-op when the target already matches. Informative entries go to Plan, `build.md`, or provenance.

## Coverage gate

Before handoff, check coverage against the complete target model: the Change's Expected Semantic Model, or the active Candidate. Split each normative entry into atomic details: conditions, numbers, examples, counterexamples, timing, exceptions. Give each detail one exact location: an Element identity plus its Declaration, a Section, or an Acceptance Case in that Section; or a Relationship, Element Kind, Relationship Kind, or Authored View. For an Element location, add a `quote`: the excerpt at that location that carries the detail, copied from the current target file, never from memory or paraphrased. If the excerpt states only a general rule without the example's concrete inputs and outcomes, the example is uncovered. Unchanged current semantics may serve as a no-op location. A rule placed without its aligning example leaves the example uncovered: an example without a location counts as uncovered. A summary claim such as "checked item by item" is not a coverage result.

Submit the result as JSON through `xirang record coverage <explorationId> (--change "<name>" | --candidate) --source-version <sourceVersion> --from <file> --json`:

```json
{ "entries": [ { "identity": "retry-window", "details": [
  { "detail": "at most 3 retries", "location": { "element": "retry-policy", "section": "Business Logic" }, "quote": "Retry at most 3 times within 30 seconds" },
  { "detail": "cancelled at second 10 is not retried", "location": { "element": "retry-policy", "section": "Key Acceptance Cases", "acceptanceCase": "Cancelled request is not retried" }, "quote": "a request cancelled at second 10 is not retried" }
] } ] }
```

The CLI rejects a missing normative entry, an unknown entry, an entry with no details, any `uncovered` detail, a location absent from the target, or a missing quote or one that does not appear at its location (whitespace and Markdown emphasis are ignored), and records nothing. On rejection, write the missing detail into the target first, then recheck and resubmit. The CLI proves the check ran, each location exists, and each quote appears there, not that the quote expresses the detail; the semantic judgment remains the checker's. The `structure` part is not split into details: `consume` compares it field by field with the target. Any Delta or Candidate edit after recording coverage requires rechecking and recording again. An exempted or normative-free source has no entries to check; state that explicitly.

## Output and handoff

Consumers explicitly select the named Change or active Candidate and bind the reviewed `sourceVersion`; never infer a target from cwd. After coverage is recorded and applicable validation passes, run `xirang record consume <explorationId> (--change "<name>" | --candidate) --source-version <sourceVersion> --json`. It rejects missing or stale coverage (source version or target changed since recording) and any field-level `structure` mismatch, including a `removed: true` object that still exists. On success it copies exact bytes to `record-source.md` beside `record-coverage.json`, revalidates, and deletes the active record. Failure preserves the source and existing destination; identical snapshots may resume after revalidation, conflicting snapshots must stop. Check the returned target and source cleanup before reporting handoff complete. Both files are formation history, not a second normative model or Delta, and never enter formal partitions.