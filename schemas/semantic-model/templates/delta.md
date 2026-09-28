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

For business-specification Elements, their Kind must declare `contract: required` and
`contractFormat: business-specification`. The complete Expected Contract requires:

```markdown
### Section: Scope and Non-goals
<responsibility boundary and exclusions>

### Section: Business Logic
<complete related mechanism, with internal headings and diagrams as useful>

### Section: Edge Cases and Exception Handling
<applicable exceptional inputs and failure outcomes>

### Section: Key Acceptance Cases
<acceptance commitments grounded in confirmed intent>

#### Acceptance Case: <name>
<conditions, action and observable expected result>
```

Keep these four titles in English regardless of proseLanguage. Each Section needs
non-empty content and Key Acceptance Cases needs at least one non-empty case.
Additional Sections have free names and require an independently maintainable
boundary. Only include changed Sections in a delta; do not repeat unchanged ones.
Generic concept Contracts are not automatically subject to this format.
