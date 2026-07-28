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

## ADDED Requirements

### Requirement: <name>
<normative target-state requirement>

#### Scenario: <name>
- **WHEN** <condition>
- **THEN** <outcome>
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
