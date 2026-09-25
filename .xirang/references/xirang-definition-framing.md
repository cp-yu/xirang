# Definition Framing Protocol

Definition Framing is a shared method for Build and Explore, not a required structural stage. Use it throughout formation to clarify and retain confirmed design. A record may contain only part of the design; neither a complete hierarchy nor a record is required to start discussion. This protocol owns record authorization, conflict handling, reload, and handoff. The exploration reference owns conversation flow, not persistence permissions.

## Inputs and authority

- Load the Semantic Model, user-authorized scope, project evidence, and any current record. An absent formal model is valid for initial Build; a damaged existing model is an error, never an empty starting point.
- Run `xirang framing list --json` and select by immutable `explorationId`, not slug or path. Build and Change use independent instances; never reuse a record across contexts.
- Before starting, resuming, replacing a record, or handing off conclusions, run `xirang framing show <explorationId> --json`, `xirang framing status <explorationId> --json`, and `xirang framing validate <explorationId> --json`. Read the complete current payload and retain `sourceVersion`. Never reconstruct it from recent conversation or Summary.
- The CLI checks format, identity, paths, versions, and explicit related context. `semanticCoverage: not-evaluated` is not approval. Agents assess natural-language conflicts and coverage; users decide unresolved intent. Treat relevant drift as a re-review gate: distinguish authorized evolution from unresolved contradictions, resolve them, and separately authorize any baseline-refreshing record update. Unsupported legacy records require user handling; do not migrate or delete them automatically.

## Confirm and capture

Retain the key confirmations that downstream generation must not change, including conditions, numbers, exceptions, timing, and structural fragments. User-requested material takes precedence over the Agent's importance filter. Ordinary discussion, alternatives, full rationale, and implementation/test plans are not automatically captured; when the user requests them, retain their informative nature instead of promoting them into obligations.

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

1. Before composing a replacement, reload the complete current payload. Combine it with only the proposed changes; preserve unrelated entries and identities.
2. Identify changed entries, conflicts with earlier confirmations, and dependent design conclusions. MUST NOT treat the latest statement as overriding earlier confirmation. Explain the impact and ask the user to resolve conflicts before saving. A ruling is not write authorization.
3. Show the complete proposed payload, record identity (or new-record slug), and managed target `.xirang/framing/`. Obtain separate explicit persistence confirmation for each create or update. Agreement with a design direction, option, or section does not authorize persistence.
4. Send that exact payload on stdin to `xirang framing create --slug <slug> --json` or `xirang framing update <explorationId> --json`. Use only the CLI, never directly edit managed files. Full replacement removes omitted entries: omission is not an implicit approved deletion.
5. Inspect returned `diff.added`, `diff.modified` (before/after), and `diff.removed`. Unauthorized disappearance is a context-amnesia signal: stop, reconcile with the user, and obtain authorization for any repair. Reload with show/status/validate before continuing; invalidate affected Summary and coverage conclusions, then recheck them. Keep unrelated conclusions intact.
6. Use `xirang framing rename <explorationId> --slug <slug> --json` or `xirang framing discard <explorationId> --json` only with explicit authorization for that action.

## Summary and semantic coverage gates

Before Explore outputs a Design Summary, reload the complete record and check both internal conflicts and conflicts with the proposed design. Unresolved conflicts block Design Summary. Explain and obtain a user ruling; if a record must change, repeat the separate write authorization, diff review, reload, and conflict check. Later record changes invalidate affected Summary and coverage conclusions. With no record, use ordinary design self-review; do not create an empty record. Summary remains conversation-only. When record-backed, it MUST carry `explorationId` and the checked `sourceVersion`, not a duplicate record. With no record, omit those fields.

Before a consumer hands off the source, an Agent must check each normative confirmation against the complete target model: preserve conditions, numbers, exceptions, and timing in the appropriate Declaration, Contract, Relationship, or Metamodel. Existing satisfied semantics may be no-op. Informative entries belong in Plan/build notes or provenance, not new obligations. Missing behavior goes into its Contract before downstream planning; unresolved intent goes to the user. Matching strings, valid references, and a successful CLI validation cannot prove semantic coverage. A short in-conversation mapping is sufficient; do not create a permanent audit ledger.

## Output and handoff

Consumers explicitly select the named Change or active Candidate and bind the reviewed `sourceVersion`; never infer a target from cwd. Propose additionally checks target semantics against implementation tasks and observable Checks before Change validation and consumption. Build retains its Candidate validation, independent review, exact-digest confirmation, and promotion gates; it adds no Design Summary stage.

The consumer uses `xirang framing consume` only after the applicable coverage and deterministic gates. It copies exact bytes to `framing-source.md` and revalidates before deleting the active record. Failure preserves the source and existing destination; identical snapshots may resume after revalidation, conflicting snapshots must stop. A version change requires reload and new affected checks, never reuse stale approval. Check the returned target and source cleanup before reporting handoff complete. The snapshot is formation provenance, not a second normative model or Delta, and never enters formal partitions.