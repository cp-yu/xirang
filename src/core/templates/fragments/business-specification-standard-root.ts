/**
 * Fragment: Business Specification Standard (root guidance)
 * Used in: build, explore, propose, apply-change
 *
 * The 3+N standard is root guidance, so a compact form is inlined into each
 * generated SKILL.md and the full list of containers lives in the reference file.
 * `references/business-specification-standard.md` is materialized by `xirang update`.
 */
export const BUSINESS_SPECIFICATION_STANDARD_ROOT = `**Business Specification Standard (3+N)**

Every Element Contract SHALL give each class of normative detail its own container, so detail captured during exploration is not lost when it becomes a Section or a Task.

- **Resident base items, always required**: ① business goal — carried by the Declaration \`definition\`; ② scope and non-goals — its own Section naming what this Element does not do; ③ business mechanics — its own Section expressing the logic derivation.
- **\`+N\` items, mounted explicitly when the business carries the characteristic**: state and lifecycle, concurrency and mutual exclusion, triggers and timing, external contracts and fallback, key acceptance cases, plus any item the project's own characteristics call for. Never leave these implicit in natural language.
- **Safeguards and edge cases**: a table (or equivalent) enumerating extremes and empties, resource exhaustion, and security defence, kept out of the main flow.
- **Key acceptance cases**: a dedicated Section using \`#### Acceptance Case:\`; one positive flow, plus a boundary flow and a conflict flow when applicable. Not one case per detail, and never demanded of other Sections.
- **Carriers are free**: pseudocode, decision tables, formulas, and event triples are hints, not an enumeration. Any carrier that expresses the item completely is acceptable.
- **Container to task mapping**: each mounted \`+N\` item, each safeguards row, and each acceptance case SHOULD become an independently verifiable task or Check unit, so a missing container surfaces when tasks are written rather than later at model alignment.
- **Check anchors**: a Check points at its target semantics with a change-local Element unit path plus a Section anchor, appending an Acceptance Case anchor only when it verifies a key acceptance case. A free-form description is not an anchor.
- Read \`.xirang/references/xirang-business-specification-standard.md\` (project-root file) for the complete standard and its self-check list.`;
