# Migration Guide

OPSX has one active CLI identity and one active workspace layout:

- CLI: `opsx`
- Workspace: `.opsx/`
- Semantic Model graph: versioned `.opsx/architecture/**/*.c4`
- Element contracts: `.opsx/specs/**/spec.md` with singular `element` binding

There is no legacy CLI alias, directory fallback, dual read/write mode, or automatic workspace relocation. Existing legacy inputs remain unchanged until an explicit migration is requested.

## Migrate A Legacy Semantic Model

For an unversioned domain/capability LikeC4 model, generate an auditable v1 candidate:

```bash
opsx migrate semantic-model --json
opsx migrate semantic-model --candidate .opsx/migration-candidate --json
```

The migrator records source/target versions, resolved stable identity mappings, and review gaps. It writes only the candidate until promotion is explicitly authorized. Ambiguous identity or Spec ownership blocks promotion; the migrator never guesses an owner from a file name or path.

```bash
opsx migrate semantic-model --promote --yes --json
```

Promotion requires zero unresolved gaps and complete target validation. Graph and contract modules are promoted atomically; a failed write leaves the formal source unchanged. The current repository self-model is not automatically migrated.

## Legacy YAML Conversion

The former `opsx-to-likec4` command is retained solely for repositories with the **legacy OPSX YAML architecture bundle**. It is not the v1 Semantic Model migration path and it does not enable runtime fallback:

```bash
opsx migrate opsx-to-likec4 --dry-run
opsx migrate opsx-to-likec4
opsx arch validate
```

This one-time converter validates generated LikeC4 and preserves the YAML inputs with `.backup` suffixes. Review the generated candidate, stable IDs, Spec bindings, and relationship directions before adopting it. Runtime commands never read the legacy YAML or backup files.

## Move Workspace Content Explicitly

Commit or back up the repository first. Move durable content into `.opsx/` with normal filesystem or Git operations, then update links and automation to use `opsx` and `.opsx/`. Preserve archive history as history; do not rewrite archived change content solely to modernize terminology.

## Refresh Managed Skills

```bash
opsx update
```

This regenerates OPSX-owned workflow skills for configured tools. User-authored files and archive history remain outside that managed output set.

## Validation Checklist

```bash
opsx --help
opsx validate --all --strict
opsx arch validate
opsx view --port 5173
```

- No active command invokes a legacy CLI name.
- No active workflow reads a workspace other than `.opsx/`.
- v1 Specs use singular `element` bindings and resolve to stable element IDs.
- LikeC4 graph modules use an explicit language version and unique Project Root.
- CI installs and builds the root and vendored LikeC4 workspaces explicitly.
