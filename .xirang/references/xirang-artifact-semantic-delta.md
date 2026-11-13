# semantic-delta

## Definition

```yaml
purpose: Express the semantics this Change adds, modifies, or removes.
compilationRole: Semantic Delta compiled against the current Semantic Model.
content:
  includes:
    - Complete target-state Semantic Delta entries across elements, metamodel,
      relationships, and views.
  excludes:
    - Motivation, implementation decisions, rationale, task planning, change-log
      narration, and Agent reasoning.
writePolicy: agent-authored
validation:
  - xirang validate --change <name> --json
  - xirang arch validate --change <name> --json
```

## Guidance

Create or reconcile the Change's Semantic Delta across `elements/`, `metamodel/`, `relationships/`, and `views/`.

Treat the returned template as a per-unit shape reference, not one file to copy. If no Semantic Delta is required, create only `.delta-noop`; otherwise remove a stale marker. The marker carries no semantics and MUST NOT be synced or archived.

Author units by self-declared entity type:
- Frontmatter declares `entity`; the partition does not determine entity type.
- element-declaration: identity, kind, parent, title, definition
- element-kind: identity, contract; optional contractFormat, root, parents, children
- relationship-kind: identity; optional sourceKinds, targetKinds
- authored-view: identity, include; optional exclude, of, title, autoLayout
- Every identity uses `[A-Za-z0-9._-]+`, never a path separator, and must not encode parent hierarchy.
- Default filenames are organizational conventions only; unchanged partitions stay empty.

Apply Delta semantics per entry:
- Declaration, Kind, and View entries add `operation: ADDED|MODIFIED|REMOVED`; ADDED and MODIFIED carry complete target content, while REMOVED carries only identity.
- Element Contract target content is `## Specification`; Delta Section entries factor operation into `## ADDED Sections`, `## MODIFIED Sections`, and `## REMOVED Sections` sections.
- ADDED and MODIFIED Sections contain the complete target Section with a canonical `### Section:` header and a free body; REMOVED names only the Section.
- Each ADDED or MODIFIED Section must contain the uppercase keyword `SHALL` or `MUST` in its own body, before any Acceptance Case headers; keywords only inside case bodies do not satisfy this format check. Restate the confirmed commitment without adding a new restriction.
- Existing titles under MODIFIED Sections stay exact; new Section titles follow `proseLanguage` except the four fixed English business-specification titles.
- Agent MUST NOT author Acceptance Case operation labels.
- When only Contract entries change, declaration frontmatter locates the Element without `operation`; when only the Declaration changes, leave the body empty.

Follow partition-specific rules:
- `elements/` units combine one Element Declaration entry with zero or more Section entries. A Section identity is `<element identity>#<title>` globally and only `<title>` within its unit; complete concept identity and scope prose belongs only in `definition`.
- `metamodel/` units contain one Element Kind or Relationship Kind entry.
- `views/` units contain one Authored View entry.
- `relationships/` YAML contains `{operation, source, kind, target}` entries, has no description field, and does not support `MODIFIED` because the three identity fields are its complete content.

For business-specification Kinds and Contracts, follow project-root file `.xirang/references/xirang-business-specification-standard.md`, loading it only when applicable and not already current. That reference owns applicability, mandatory Sections, Acceptance Cases and self-checks. A Delta includes only changed Sections; CLI checks the complete Expected Contract.

Route motivation to `proposal.md`, decisions to `design.md`, and implementation work to `tasks.md`. Validate with the commands from `definition.validation`, and do not add placeholders, empty Delta sections, or process notes to authored units.


## Template

<!-- elements/<identity>.md -->
```markdown
---
operation: ADDED
entity: element-declaration
identity: <identity>
kind: <element-kind identity>
parent: null
title: <title>
definition: <complete target definition>
---

## ADDED Sections

### Section: <name>
<normative target-state commitment; body is free — any carrier, any sub-headings>

#### Acceptance Case: <name>
- <observable acceptance result; use this form only inside the key-acceptance-cases Section>
```

<!-- metamodel/<kind identity>.md -->
```markdown
---
operation: ADDED
entity: element-kind
identity: <kind identity>
contract: required
---

<shared target-state semantics>
```

<!-- views/<view identity>.md -->
```markdown
---
operation: ADDED
entity: authored-view
identity: <view identity>
include:
  - <element identity>
exclude:
  - <element identity>
---
```

<!-- relationships/<relationship kind identity>.yaml -->
```yaml
relationships:
  - operation: ADDED
    source: <source element identity>
    kind: <relationship kind identity>
    target: <target element identity>
```

For business-specification Contracts, use the complete structure in project-root file
`.xirang/references/xirang-business-specification-standard.md`. Include only changed
Sections in the Delta; apply the format to the complete Expected Contract.
