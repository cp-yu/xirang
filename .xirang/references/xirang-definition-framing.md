# Definition Framing Protocol

Definition Framing is a shared method for Build and Explore. It is required for formation that produces normative content: whenever the confirmed design contains a normative confirmation, that confirmation MUST reach a persisted record before handoff. A record may contain only part of the design and neither a complete hierarchy nor a record is required to start discussion, but ending formation with unrecorded normative confirmations is a defect, not a neutral default. When the user explicitly declines a record, formation continues under a recorded exemption rather than a silent skip. This protocol owns record authorization, conflict handling, reload, handoff, and the record decision. The exploration reference owns conversation flow, not persistence permissions.

## Inputs and authority

- Load the Semantic Model, user-authorized scope, project evidence, and any current record. An absent formal model is valid for initial Build; a damaged existing model is an error, never an empty starting point.
- Run `xirang framing list --json` and select by immutable `explorationId`, not slug or path. Build and Change use independent instances; never reuse a record across contexts.
- Before starting, resuming, replacing a record, or handing off conclusions, run `xirang framing show <explorationId> --json`, `xirang framing status <explorationId> --json`, and `xirang framing validate <explorationId> --json`. Read the complete current payload and retain `sourceVersion`. Never reconstruct it from recent conversation or Summary.
- The CLI checks format, identity, paths, versions, and explicit related context. `semanticCoverage: not-evaluated` is not approval. Agents assess natural-language conflicts and coverage; users decide unresolved intent. Treat relevant drift as a re-review gate: distinguish authorized evolution from unresolved contradictions, resolve them, and separately authorize any baseline-refreshing record update. Unsupported legacy records require user handling; do not migrate or delete them automatically.

## Confirm and capture

Retain the key confirmations that downstream generation must not change, including conditions, numbers, exceptions, timing, and structural fragments. User-requested material takes precedence over the Agent's importance filter. Ordinary discussion, alternatives, full rationale, and implementation/test plans are not automatically captured; when the user requests them, retain their informative nature instead of promoting them into obligations.

When the confirmed design contains at least one normative confirmation, confirm exactly one record decision before handoff: a persisted record, or an explicit user-granted exemption. Never end formation with normative confirmations and neither. A record decision is not required when the confirmed design carries no normative content.

An exemption is user-granted, deliberate, and recorded. When the user declines a record, do not create an empty record and do not stop; record the exemption and its reason in the Design Summary as an explicit no-record declaration, and carry it into downstream provenance. A silent skip is never an exemption. Re-open the decision if later confirmations add normative content the user has not exempted.

For structural choices, apply the decomposition guidance resolved from the normalized `decomposition` value: read the guidance file at that resolved path in full before forming or reorganizing structure. Stop and ask when the guidance is missing or unreadable. Do not invent hierarchy work for behavior-only decisions or redo already confirmed structure.

Use a nonempty, versioned payload; this is not a Semantic Delta or a complete model. For example:

```yaml
schemaVersion: 2
context: change
relatedIdentities: [service]
entries:
  - identity: retry-window
    nature: normative
    content: Retry at most 3 times within 30 seconds, except after cancellation.
  - identity: retry-rationale
    nature: informative
    content: The user asked to preserve the rejected unbounded-retry alternative for context.
```

Use `context: build` for a separate Build instance, including before Candidate init. `relatedIdentities` lists affected or dependent model identities (possibly empty), including relevant parent/Kind/Relationship endpoints; these are explicit context hints, not a machine-inferred completeness claim. Entry identities stay stable through revisions. Slug changes do not change record identity.

## Authorize each write

The calling workflow must permit the operation: Build and Explore may use the following record-write protocol. Propose MUST NOT create, update, rename, or discard records; its only external write is post-gate `framing consume`. A needed record revision blocks Propose and returns to Explore for separate authorization, diff review, and reloaded handoff. This shared protocol never expands stage permissions.

Batch by design section, not by confirmation. Keep one persistence confirmation per create or update, but do not interrupt the conversation once per individual entry: let a design section finish, then present every entry that section produced together and ask for one decision on that batch. Batching changes when the confirmation happens, never how many authorizations a write needs. It does not relax the one-clarification-question-at-a-time discipline for design itself: batching applies to the persistence decision on entries already confirmed, not to unresolved design questions.

1. Before composing a replacement, reload the complete current payload. Combine it with only the proposed changes; preserve unrelated entries and identities.
2. If the section produced no normative confirmation, do not ask for a persistence decision.
3. Identify changed entries, conflicts with earlier confirmations, and dependent design conclusions. MUST NOT treat the latest statement as overriding earlier confirmation. Explain the impact and ask the user to resolve conflicts before saving. A ruling is not write authorization.
4. Show the complete proposed payload, record identity (or new-record slug), managed target `.xirang/framing/`, and the entries this batch adds or changes, including those the user declined. Obtain one explicit persistence confirmation for this create or update. Agreement with a design direction, option, or section does not authorize persistence, and an entry carried into the batch without the user addressing it is not confirmed.
5. Send that exact payload on stdin to `xirang framing create --slug <slug> --json` or `xirang framing update <explorationId> --json`. Use only the CLI, never directly edit managed files. Full replacement removes omitted entries: omission is not an implicit approved deletion.
6. Inspect returned `diff.added`, `diff.modified` (before/after), and `diff.removed`. Unauthorized disappearance is a context-amnesia signal: stop, reconcile with the user, and obtain authorization for any repair. Confirm every entry this batch intended to add or change actually landed, and that no entry the user declined was persisted. Reload with show/status/validate before continuing; invalidate affected Summary and coverage conclusions, then recheck them. Keep unrelated conclusions intact.
7. Use `xirang framing rename <explorationId> --slug <slug> --json` or `xirang framing discard <explorationId> --json` only with explicit authorization for that action.

## Summary and semantic coverage gates

Before Explore outputs a Design Summary, reload the complete record and check both internal conflicts and conflicts with the proposed design. Unresolved conflicts block Design Summary. Explain and obtain a user ruling; if a record must change, repeat the separate write authorization, diff review, reload, and conflict check. Later record changes invalidate affected Summary and coverage conclusions. Summary remains conversation-only. When record-backed, it MUST carry `explorationId` and the checked `sourceVersion`, not a duplicate record. When exempted, it MUST carry the explicit no-record declaration and the reason. When the confirmed design carries no normative content, state that instead. Do not create an empty record under any of these paths.

Before a consumer hands off the source, an Agent must check each normative confirmation against the complete target model: preserve conditions, numbers, exceptions, and timing in the appropriate Declaration, Contract, Relationship, Metamodel, or Authored View. Existing satisfied semantics may be no-op. Informative entries belong in Plan/build notes or provenance, not new obligations. Missing behavior goes into its Contract before downstream planning; unresolved intent goes to the user. Matching strings, valid references, and a successful CLI validation cannot prove semantic coverage. Coverage is checked entry by entry against the record's own identities: each normative entry is either placed in the target model or reported as uncovered, and an unchecked entry counts as uncovered. Record the per-entry result in the conversation; do not create a permanent audit ledger. An exempted or normative-free source has no entries to check, and that absence MUST be stated rather than implied by silence.

## Output and handoff

Consumers explicitly select the named Change or active Candidate and bind the reviewed `sourceVersion`; never infer a target from cwd. Propose additionally checks target semantics against implementation tasks and observable Checks before Change validation and consumption. Build retains its Candidate validation, independent review, exact-digest confirmation, and promotion gates; it adds no Design Summary stage.

The consumer uses `xirang framing consume` only after the applicable coverage and deterministic gates. It copies exact bytes to `framing-source.md` and revalidates before deleting the active record. Failure preserves the source and existing destination; identical snapshots may resume after revalidation, conflicting snapshots must stop. A version change requires reload and new affected checks, never reuse stale approval. Check the returned target and source cleanup before reporting handoff complete. The snapshot is formation provenance, not a second normative model or Delta, and never enters formal partitions.