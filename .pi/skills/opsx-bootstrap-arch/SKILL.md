---
name: "opsx-bootstrap-arch"
description: "Bootstrap a LikeC4 architecture model from existing code using a five-phase workflow (init → scan → map → review → promote)."
license: "MIT"
compatibility: "Requires opsx CLI with arch commands."
metadata:
  author: "opsx"
  version: "3.0"
  generatedBy: "1.4.1-cpyu.5"
---

Bootstrap the LikeC4 architecture model from current repository evidence.

**OPSX Philosophy**

OPSX is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and LikeC4 jointly form the durable semantic source. Specs define observable behavior; LikeC4 defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

## Workflow

1. **init** — inspect the repository, Specs, and config; create `.opsx/architecture/candidates/`.
2. **scan** — collect evidence for domains, capabilities, ownership, and semantic relations. Use CodeGraph or ACE/`rg`/`read` only as current implementation evidence.
3. **map** — generate one candidate `.c4` file per domain. Nest every capability in exactly one domain; do not emit a `belongs_to` relationship.
4. **review** — compare candidate elements, metadata, and typed relations with Specs and current code evidence. Record uncertainty instead of guessing.
5. **promote** — after explicit review approval, write `.opsx/architecture/specification.c4`, `domains/*.c4`, and `views.c4`; run `opsx arch validate`.

## Candidate Contract

Use LikeC4 DSL only. MUST NOT generate YAML architecture candidates.

```likec4
model {
  cli = domain 'CLI' {
    query = capability 'Query architecture' {
      metadata {
        capabilityId 'cap.cli.arch-query'
        specs ['.opsx/specs/arch-query-command/spec.md']
      }
    }
  }
  cli.query -[invokes]-> architecture.reader
}
```

Element IDs use snake_case locally. Semantic relations use `-[invokes]->`, `-[consumes]->`, `-[precedes]->`, `-[constrains]->`, or `-[validates]->`. Keep evidence paths out of durable architecture metadata.

## Guardrails

- Do not write formal LikeC4 files before review approval.
- Do not infer architecture directly from imports or calls.
- Do not emit explicit `belongs_to`; nesting is the ownership source.
- Preserve project prose language while keeping IDs, paths, commands, and DSL tokens canonical.
