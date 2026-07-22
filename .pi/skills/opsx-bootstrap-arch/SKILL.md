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

1. OPSX is a structured representation of human intent that an Agent can compile.
2. One OPSX Semantic Model consists of LikeC4 graph modules and element-owned Markdown contract modules; they are source modules of the same model, not two parallel sources.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The OPSX Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the OPSX Semantic Model.

## Workflow

1. **init** — inspect the repository, Specs, and config; retain the existing bootstrap workspace and phase state.
2. **scan** — collect evidence for elements, refinement, Element Contracts, and semantic relationships. Use CodeGraph or ACE/`rg`/`read` only as current implementation evidence.
3. **map** — write `.opsx/bootstrap/candidate/architecture/**/*.c4` plus `.opsx/bootstrap/candidate/specs/<spec-id>/spec.md`. Lower discovered intent into a Project Root and arbitrary-depth refinement nesting; do not emit a `belongs_to`, `refines`, or `abstracts` relationship.
4. **review** — compare candidate elements, stable `elementId` metadata, typed relationships, and singular `element: <stable-id>` bindings with Specs and current code evidence. Record uncertainty instead of guessing; ambiguous parents or contract bindings are review gaps.
5. **promote** — after the existing review gate has no gaps and candidate validation passes, atomically write `.opsx/architecture/` and `.opsx/specs/`; run `opsx arch validate`.

## Candidate Contract

Use LikeC4 DSL only. MUST NOT generate YAML architecture candidates.

```likec4
opsx { languageVersion '1' }
specification {
  element project { opsx { root true contract required } }
  element area { opsx { contract optional parents [project] } }
  element component { opsx { contract optional parents [area] } }
  relationship invokes
  relationship produces
  relationship consumes
  relationship precedes
  relationship constrains
  relationship validates
}
model {
  projectRoot = project 'Project' 'Project intent is reviewed before promotion.' {
    metadata { elementId 'project.root' }
    identity = area 'Identity' 'Identity intent.' {
      metadata { elementId 'identity' }
      sign_in = component 'Sign in' 'Sign-in intent.' {
        metadata { elementId 'identity.sign-in' }
      }
    }
  }
}
```

Element kinds are project-defined and do not impose a fixed hierarchy. Use local identifiers only for LikeC4 navigation; persist stable `elementId` metadata on every element. Semantic relationships use `-[invokes]->`, `-[produces]->`, `-[consumes]->`, `-[precedes]->`, `-[constrains]->`, or `-[validates]->`. Candidate Specs use singular frontmatter `element: <stable-id>`. Keep evidence paths out of durable architecture metadata.

## Guardrails

- Do not write formal LikeC4 files before review approval.
- Do not infer architecture directly from imports or calls.
- MUST NOT emit `belongs_to`, `refines`, or `abstracts` relationships; nesting is the refinement source.
- A coarse `spec_group` with more than one possible owner is a review gap and blocks promotion; never guess.
- Preserve project prose language while keeping IDs, paths, commands, and DSL tokens canonical.
