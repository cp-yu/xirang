# Definition Framing Protocol

Definition Framing is an optional Change Formation stage for confirming structural targets before Design Exploration. It begins only when the user chooses it after the Agent recommends it for material or uncertain structural scope. This protocol owns structural framing and persistence only; the Superpowers-style reference continues to own the overall exploration conversation.

## Structural framing method

1. Start with a causal definition: state the structural problem, why the current structure causes it, and what semantic outcome the Change must create. Separate causes from symptoms and implementation preferences.
2. Clarify identity and boundaries before placement. For each proposed Element or Kind, define what it includes, what it excludes, and how it differs from nearby siblings. For a Relationship, define the source, target, and semantic meaning of its Kind.
3. Decompose the structure as a MECE set along a single structural dimension at a time. Do not mix lifecycle stage, responsibility, deployment location, and implementation technique in one sibling set. If the set is not mutually exclusive and collectively sufficient for the confirmed scope, revise the dimension before continuing.
4. Confirm in breadth-first (BFS) order: confirm the parent boundary, then the complete same-level structure, then descend one level. Do not finalize a child while unresolved siblings could change its identity or parent.
5. When identity, Kind, parent, or Relationship choices have multiple reasonable interpretations, present bounded alternatives with their semantic consequences and request one user decision. Re-run the affected MECE and BFS checks after a revision.

These steps govern structural decisions only. The Superpowers-style protocol still governs one-question conversation flow, overall option comparison, design section approval, and Design Summary handoff.

## Persistence boundary

- Persist only complete structural targets explicitly confirmed by the user: Element Kinds, Relationship Kinds, Element Declarations, and Relationships.
- A design-direction confirmation is not an explicit persistence confirmation. Before every create or update, show the complete current payload and ask separately whether to persist that exact payload.
- Use only `xirang framing` commands. Do not directly create, edit, rename, move, or delete the managed file.
- Do not persist Contract content, Authored Views, design rationale, implementation details, or the Design Summary.
- Every update is full replacement. Omitted targets are removed from the framing payload; deletion targets use only explicit `operation: REMOVED`.
- Before composing any replacement payload, run `xirang framing show <explorationId> --json` and read the complete current payload. Compose the replacement as the complete current payload plus this session's explicitly confirmed changes; never reconstruct it from memory or omit a target that was not explicitly confirmed for removal.

## Lifecycle

1. Run `xirang framing list --json`. Resume the relevant record by immutable `explorationId`; do not infer identity from its slug or path.
2. For a new record, prepare the complete payload, obtain explicit persistence confirmation, then pass it on stdin to `xirang framing create --slug <slug> --json`.
3. Before resuming or replacing a record, run `xirang framing show <explorationId> --json`, `xirang framing status <explorationId> --json`, and `xirang framing validate <explorationId> --json`. On every resume, run all three before Design Exploration continues. Use `show` for the complete current payload, `status` for baseline drift, and `validate` for current impacts.
4. After confirmation of a replacement payload, pass the complete payload on stdin to `xirang framing update <explorationId> --json`. Never merge omitted fields locally. After every update, review the `diff` returned in the result: any target that disappeared from the payload without explicit confirmation is a context-amnesia signal that MUST be reconciled before continuing.
5. Run `xirang framing validate <explorationId> --json` after create or update. Structural errors block Design Exploration. Contract and Authored View impacts require downstream design decisions but do not mutate those artifacts.
6. Use `xirang framing rename <explorationId> --slug <slug> --json` only for a confirmed label change. The immutable identity remains unchanged.
7. Use `xirang framing discard <explorationId> --json` only after explicit discard confirmation.

## Change handling

When a confirmed structural target changes, invalidate the affected structural confirmations and every downstream design decision that depends on them. Reconfirm the complete replacement payload first, then revisit the affected Contract, Authored View, data-flow, testing, and risk decisions. Unrelated design decisions remain valid.

The framing record is an intermediate Change Formation artifact. Propose compiles it into the canonical Semantic Delta and freezes it as historical provenance; it does not become a third normative Change component.