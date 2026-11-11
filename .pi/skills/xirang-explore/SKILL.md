---
name: "xirang-explore"
description: "Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.8"
---

Explore the user's intent with project evidence, maintain the intermediate design, and confirm a design ready for Propose. Do not implement the formal Change, write the formal model or generated work surfaces, or author complete Change artifacts. CLI-managed records and delegated feasibility experiments are permitted within their protocols.

Before doing stage work, load the xirang-common skill from this tool's discovered skills or from ../xirang-common/SKILL.md relative to this skill file, unless its required guidance is already available and current in this Agent's project context. Keep the selected stage while loading it; do not route back or load this stage again. Follow common's on-demand guidance and reuse rules.

For a Kind or Contract with `contractFormat: business-specification`, read project-root file `.xirang/references/xirang-business-specification-standard.md` before exploring or authoring it, unless already available and current. Generic framework or organizational Elements do not trigger this format.

When designing verification, changing tests or reviewing test evidence, read project-root file `.xirang/references/xirang-test-quality.md` unless already available and current.

## Load and navigate

Read `.xirang/references/xirang-explore-supperpowers-style.md` before exploring unless already available and current; it owns the design loop, question/confirmation discipline, experiments and Summary review.

Start with `xirang list --json` and `xirang record list --json`. Read relevant active Change artifacts completely. Ground code claims in current project evidence.

Before navigating or interpreting the Semantic Model, read project-root file `.xirang/references/xirang-model-context.md` unless already available and current.

Before exploring or writing an Element Declaration or Contract, read project-root file `.xirang/references/xirang-semantic-authoring.md` unless already available and current.

Only before forming or reorganizing a hierarchy, read project-root file `.xirang/references/xirang-decomposition-use.md` unless already available and current; then follow its normalized configuration routing. Contract-only work does not trigger it.

For new or unfamiliar concepts affecting scope, search for finite candidates, inspect their refinement context and select focus identities; if ambiguity remains, ask one clarification question. Use `arch impact <identities...> --depth 2 --json` for relationship summary and refinement context, then query only the semantics needed to judge mustChange, mustVerify, contextual scope, unknowns and drift. Adjacency alone proves none of those conclusions. Do not pass a Change or Delta to impact. Before readiness, recheck focus Elements and evidence coverage and disclose gaps.

Assess Declaration/Definition impact only when concept identity or scope changes, and carry the complete confirmed target Definition into the Summary. Invoke configured decomposition guidance only for new Elements, reparenting or sibling reorganization; Contract-only work does not require hierarchy design. Guidance does not expand Explore's write permissions.

## Design Record entry points

Read `.xirang/references/xirang-design-record.md` before using a relevant existing record, preserving a pending question/hypothesis/recommendation, recording or revising design content, or closing a missing record decision before Summary. Ordinary discussion without these triggers does not preload it.

The shared protocol owns nature/decision states, user authority, complete and selective reads, partial CLI updates, conflict handling, user-facing record presentation and the Summary gate. Apply its **User-facing record presentation** rules at record loads and after updates. Apply it immediately after confirmations without asking for separate persistence permission. Proactively preserved suggestions remain pending; only the user permits accepted/excluded decisions and substantive revisions of confirmed content or structure. Keep unconfirmed structure in pending text. Record changes invalidate affected conclusions; reuse the loaded protocol unless context is lost or its content is unavailable.

## Work and handoff

Follow the design loop in the required reference. Delegate necessary practical questions to `xirang-experimenter` with the question, constraints and decision background, allowing independent experiment design and an appropriate location (workspace, temporary directory, copy or worktree). Finish necessary experiments before confirming dependent design. Maintain current design through the record rather than rewriting complete Change drafts.

After the reference's self-review and record gates, present the conversation-only Design Summary for review and stop. Once accepted, the user may request Propose in natural language or invoke `/skill:xirang-propose <change-name>`; load its skill only after that request. Do not offer to start implementation.

### Existing Change capture

Read the active Change's Plan and Delta completely. Explore may maintain its design record but does not edit the Change. Carry future capture targets into the conversation-only Design Summary: behavior → Element Contract; identity/hierarchy → Declaration; relationships/kinds/views → their Delta partitions; scope → proposal.md; rationale, implementation strategy and rejected approaches → design.md; implementation and verification work → tasks.md.
