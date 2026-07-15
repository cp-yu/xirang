# Customization

OpenSpec provides project-level configuration and built-in schema inspection:

| Level | What it does | Best for |
|-------|--------------|----------|
| **Project Config** | Set defaults, inject context/rules | Most teams |
| **Built-in Schemas** | Select and inspect `spec-driven` or `bootstrap` | All projects |

---

## Project Configuration

The `openspec/config.yaml` file is the easiest way to customize OpenSpec for your team. It lets you:

- **Set a default schema** - Skip `--schema` on every command
- **Set document prose language** - Tell OpenSpec which language to use for natural-language artifact body text
- **Inject project context** - Compile project background into prompt/runtime projection consumers
- **Add per-artifact rules** - Compile artifact-scoped authoring constraints without leaking the whole raw config

### Quick Setup

```bash
openspec init
```

This walks you through creating a config interactively. Or create one manually:

```yaml
# openspec/config.yaml
schema: spec-driven
docLanguage: zh-CN

context: |
  Tech stack: TypeScript, React, Node.js, PostgreSQL
  API style: RESTful, documented in docs/api.md
  Testing: Jest + React Testing Library
  We value backwards compatibility for all public APIs

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
    - Reference existing patterns before inventing new ones
```

`openspec/config.yaml` stays intentionally small. OpenSpec compiles its validated whitelist fields into prompt and runtime projection bundles for downstream consumers.

`docLanguage` only applies to natural-language prose in OpenSpec artifacts. Template headings, IDs, schema keys, relation types, BDD keywords, file paths, commands, and code identifiers stay in their canonical form.

### How It Works

**Default schema:**

```bash
# Without config
openspec new change my-feature --schema spec-driven

# With config - schema is automatic
openspec new change my-feature
```

**Context and rules injection:**

When generating any artifact, OpenSpec exposes a compiled projection bundle plus compatibility fields derived from the same normalized inputs:

```xml
<config_projection>
- Use zh-CN for natural-language prose that you newly write or revise.
- Preserve canonical tokens unchanged: SHALL, MUST, section headers, scenario headers, BDD keywords, IDs, schema keys, paths, commands, and code identifiers.
Tech stack: TypeScript, React, Node.js, PostgreSQL
- Include rollback plan
- Identify affected teams
</config_projection>

<project_context>
Tech stack: TypeScript, React, Node.js, PostgreSQL
...
</project_context>

<rules>
- Include rollback plan
- Identify affected teams
</rules>

<template>
[Schema's built-in template]
</template>
```

- **Projection bundle** is the preferred contract for prompt/runtime consumers
- **Context** still appears in ALL artifacts as a compatibility field derived from the same normalized config
- **Rules** still appear only for the matching artifact as a compatibility field derived from the same normalized config

### Schema Resolution Order

When OpenSpec needs a schema, it checks in this order:

1. CLI flag: `--schema <name>`
2. Change metadata (`.openspec.yaml` in the change folder)
3. Project config (`openspec/config.yaml`)
4. Default (`spec-driven`)

---

## Built-in Schemas

OpenSpec resolves exactly two package-owned schemas:

- `spec-driven` for proposal, specs, design, tasks, and apply workflows.
- `bootstrap` for the structured OPSX bootstrap lifecycle.

Project-local `openspec/schemas/` directories and user schema directories are ignored. `openspec schema init` and `openspec schema fork` are not available.

Validate one or both built-in schemas:

```bash
openspec schema validate spec-driven
openspec schema validate bootstrap
openspec schema validate
```

Inspect their package locations:

```bash
openspec schema which spec-driven
openspec schema which bootstrap
openspec schema which --all
```

Schema binding still follows CLI option → change metadata → project config → `spec-driven`, but every binding must be either `spec-driven` or `bootstrap`.

## See Also

- [CLI Reference: Schema Commands](cli.md#schema-commands) - Full command documentation
