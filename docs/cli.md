# CLI Reference

The Xirang CLI (`xirang`) provides terminal commands for project setup, validation, status inspection, architecture browsing, and lifecycle management. These commands complement the managed workflow skills documented in [Workflow Skills And Architecture Commands](commands.md).

## Summary

| Category | Commands | Purpose |
|----------|----------|---------|
| **Setup** | `setup`, `update` | Set up and update Xirang in your project |
| **Browsing** | `list`, `view`, `show` | Explore Changes and the Semantic Model |
| **Validation** | `validate` | Check Changes and Element Contracts for issues |
| **Lifecycle** | `archive` | Finalize completed changes |
| **Workflow** | `status`, `instructions`, `templates`, `schemas` | Artifact-driven workflow support |
| **Schemas** | `schema validate`, `schema which` | Inspect and validate built-in workflows |
| **Config** | `config` | View and modify settings |
| **Utility** | `feedback`, `completion` | Feedback and shell integration |

---

## Human vs Agent Commands

Most CLI commands are designed for **human use** in a terminal. Some commands also support **agent/script use** via JSON output.

### Human-Only Commands

These commands are interactive and designed for terminal use:

| Command | Purpose |
|---------|---------|
| `xirang setup` | Initialize project (interactive prompts) |
| `xirang view` | Local Semantic Model and Element Contract browser |
| `xirang config edit` | Open config in editor |
| `xirang feedback` | Submit feedback via GitHub |
| `xirang completion install` | Install shell completions |

### Agent-Compatible Commands

These commands support `--json` output for programmatic use by AI agents and scripts:

| Command | Human Use | Agent Use |
|---------|-----------|-----------|
| `xirang list` | Browse active Changes | `--json` for structured data |
| `xirang show <item>` | Read content | `--json` for parsing |
| `xirang validate` | Check for issues | `--all --json` for bulk validation |
| `xirang status` | See artifact progress | `--json` for structured status |
| `xirang instructions` | Get next steps | `--json` for agent instructions |
| `xirang templates` | Find template paths | `--json` for path resolution |
| `xirang schemas` | List available schemas | `--json` for schema discovery |

Xirang's verify gate now runs a two-phase contract by default and accepts `--skip-optimization` when you want a Phase 1 conformance-only pass. When Phase 2 runs, it keeps a `git stash` checkpoint so failed optimization attempts can restore the exact Phase 1 baseline. `/xirang:archive` reuses a fresh verify result when possible, but if it must re-run full verify, that rerun is required to honor the same Phase 2 contract whenever optimization is still eligible.

---

## Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--version`, `-V` | Show version number |
| `--no-color` | Disable color output |
| `--help`, `-h` | Display help for command |

---

## Setup Commands

### `xirang setup`

Initialize Xirang in your project. Creates the folder structure and configures AI tool integrations.

Default behavior installs the fixed managed workflow skills.

```
xirang setup [path] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Target directory (default: current directory) |

**Options:**

| Option | Description |
|--------|-------------|
| `--tools <list>` | Configure AI tools non-interactively. Use `all`, `none`, or comma-separated list |
| `--force` | Auto-cleanup legacy files without prompting |

**Supported tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `claude`, `cline`, `codex`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `kilocode`, `kiro`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

**Examples:**

```bash
# Interactive initialization
xirang setup

# Initialize in a specific directory
xirang setup ./my-project

# Non-interactive: configure for Claude and Cursor
xirang setup --tools claude,cursor

# Configure for all supported tools
xirang setup --tools all

# Skip prompts and auto-cleanup legacy files
xirang setup --force
```

**What it creates:**

```
.xirang/
├── model/
│   ├── metamodel/       # Element and Relationship Kinds
│   ├── elements/        # Declarations and Element Contracts
│   ├── relationships/   # Typed semantic Relationships
│   └── views/           # Authored Views
├── changes/             # Proposed Semantic Deltas and Change Plans
└── config.yaml          # Project configuration

.claude/skills/          # Claude Code skills (if claude selected)
.codex/skills/          # Codex skills (if codex selected; always skills-only)
.cursor/skills/         # Cursor skills (if cursor selected)
... (other tool configs)
```

---

### `xirang update`

Update Xirang instruction files after upgrading the CLI. Re-generates managed workflow skills for configured tools.

```
xirang update [path] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Target directory (default: current directory) |

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Force update even when files are up to date |

**Example:**

```bash
# After rebuilding or updating the source checkout
xirang update
```

---

## Browsing Commands

### `xirang list`

List active Changes in your project.

```
xirang list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--changes` | List Changes explicitly (default) |
| `--sort <order>` | Sort by `recent` (default) or `name` |
| `--json` | Output `{ changes: [...] }` with compiler-derived `title` and `deltaCount` |
| `--long` | Show title, Delta count, and task status |

**Examples:**

```bash
# List all active changes
xirang list

# Detailed text output
xirang list --long

# JSON output for scripts
xirang list --json
```

**Output (text):**

```
Active changes:
  add-dark-mode     UI theme switching support
  fix-login-bug     Session timeout handling
```

---

### `xirang view`

Start the vendored LikeC4 browser for the nearest `.xirang/` project.

```
xirang view [--port <n>]
```

The browser renders the Semantic Model generated from `.xirang/model/`. Elements whose units contain Requirements expose an on-demand Contracts tab. The SPA loads the selected Formal or Change-derived Contract through the read-only `/__xirang/contract` endpoint. The command uses the vendored LikeC4 engine and does not require or resolve an external installation.

---

### `xirang show`

Display an active Change proposal as Markdown or a compiler-derived semantic diff.

```
xirang show [change-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `change-name` | No | Active Change identity (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | Output the compiled Change view as JSON |
| `--no-interactive` | Disable prompts |

JSON output contains:

| Field | Meaning |
|-------|---------|
| `id` | Change identity |
| `title` | Title derived from `proposal.md` |
| `valid` | Whether the Semantic Delta compiles to a valid Expected Semantic Model |
| `summary` | Entity-level `total`, `ADDED`, `MODIFIED`, and `REMOVED` counts |
| `entries` | Concise semantic differences keyed by entity kind and stable identity |
| `diagnostics` | Structured compiler errors and warnings |

When `valid` is false, treat `entries` only as failed-compilation context, not as a valid target state.

**Examples:**

```bash
# Interactive selection
xirang show

# Show the proposal Markdown
xirang show add-dark-mode

# Show the compiled Change view
xirang show add-dark-mode --json
```

---

## Validation Commands

### `xirang validate`

Validate Changes and Element Contracts for structural issues.

```
xirang validate [item-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `item-name` | No | Specific item to validate (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | Validate all Changes and Element Contracts |
| `--changes` | Validate all Changes |
| `--contracts` | Validate all Element Contracts |
| `--change <name>` | Validate one named Change |
| `--type <type>` | Specify an ambiguous item type: `change` or `contract` |
| `--strict` | Enable strict validation mode |
| `--json` | Output as JSON |
| `--concurrency <n>` | Max parallel validations (default: 6, or `XIRANG_CONCURRENCY` env) |
| `--no-interactive` | Disable prompts |

**Examples:**

```bash
# Interactive validation
xirang validate

# Validate a specific change
xirang validate add-dark-mode

# Validate all changes
xirang validate --changes

# Validate all Element Contracts
xirang validate --contracts

# Validate one Element Contract by Element identity
xirang validate payment.authorize --type contract

# Validate everything with JSON output (for CI/scripts)
xirang validate --all --json

# Strict validation with increased parallelism
xirang validate --all --strict --concurrency 12
```

**Output (text):**

```
Validating add-dark-mode...
  ✓ Semantic Delta valid
  ✓ Expected Semantic Model valid

Validation passed
```

**Output (JSON):**

```json
{
  "items": [
    {
      "id": "add-dark-mode",
      "type": "change",
      "valid": true,
      "issues": [],
      "durationMs": 42
    }
  ],
  "summary": {
    "totals": { "items": 1, "passed": 1, "failed": 0 },
    "byType": {
      "change": { "items": 1, "passed": 1, "failed": 0 }
    }
  },
  "version": "1.0"
}
```

---

## Lifecycle Commands

### `xirang archive`

Archive a completed Change after verify, sync, validation, and task gates pass. Archive does not update the formal Semantic Model; run `xirang sync` first when the four-partition Semantic Delta has pending model changes.

```
xirang archive [change-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `change-name` | No | Change to archive (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `--no-sync` | Bypass the pending delta sync gate with explicit authorization |
| `--no-validate` | Skip validation (requires confirmation) |
| `--no-verify` | Bypass the verify gate with explicit authorization |

**Examples:**

```bash
# Interactive archive
xirang archive

# Archive specific change
xirang archive add-dark-mode

# Archive without prompts (CI/scripts)
xirang archive add-dark-mode --yes

# Explicitly bypass the sync gate for a change with no formal-source reconciliation
xirang archive update-ci-config --no-sync --yes
```

**What it does:**

1. Requires a fresh, archive-compatible verify result unless `--no-verify` is explicitly authorized
2. Requires all four-partition Semantic Delta Entries to be synced unless `--no-sync` is explicitly authorized
3. Validates the Change unless `--no-validate` is explicitly authorized
4. Checks task completion and prompts when required
5. Moves the complete Change to `.xirang/changes/archive/YYYY-MM-DD-<name>/` as audit history

---

## Workflow Commands

These commands support the artifact-driven Xirang workflow. They're useful for both humans checking progress and agents determining next steps.

### `xirang status`

Display artifact completion status for a change.

```
xirang status [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--change <id>` | Change name (prompts if omitted) |
| `--schema <name>` | Schema override (auto-detected from change's config) |
| `--json` | Output as JSON |

**Examples:**

```bash
# Interactive status check
xirang status

# Status for specific change
xirang status --change add-dark-mode

# JSON for agent use
xirang status --change add-dark-mode --json
```

**Output (text):**

```
Change: add-dark-mode
Schema: semantic-model
Progress: 2/4 artifacts complete

[x] proposal
[ ] design
[x] specs
[-] tasks (blocked by: design)
```

**Output (JSON):**

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "semantic-model",
  "isComplete": false,
  "applyRequires": ["tasks"],
  "artifacts": [
    {"id": "proposal", "outputPath": "proposal.md", "status": "done"},
    {"id": "design", "outputPath": "design.md", "status": "ready"},
    {"id": "specs", "outputPath": "{elements,metamodel,relationships,views}/**/*", "status": "done"},
    {"id": "tasks", "outputPath": "tasks.md", "status": "blocked", "missingDeps": ["design"]}
  ]
}
```

---

### `xirang instructions`

Get enriched instructions for creating an artifact or applying tasks. Used by AI agents to understand what to create next.

```
xirang instructions [artifact] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `artifact` | No | Artifact ID: `proposal`, `specs`, `design`, `tasks`, or `apply` |

**Options:**

| Option | Description |
|--------|-------------|
| `--change <id>` | Change name (required in non-interactive mode) |
| `--schema <name>` | Schema override |
| `--json` | Output as JSON |

**Special case:** Use `apply` as the artifact to get task implementation instructions.

**Examples:**

```bash
# Get instructions for next artifact
xirang instructions --change add-dark-mode

# Get specific artifact instructions
xirang instructions design --change add-dark-mode

# Get apply/implementation instructions
xirang instructions apply --change add-dark-mode

# JSON for agent consumption
xirang instructions design --change add-dark-mode --json
```

**Output includes:**

- Template content for the artifact
- Project context from config
- Content from dependency artifacts
- Per-artifact rules from config

---

### `xirang templates`

Show resolved template paths for all artifacts in a schema.

```
xirang templates [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--schema <name>` | Schema to inspect (default: `semantic-model`) |
| `--json` | Output as JSON |

**Examples:**

```bash
# Show template paths for default schema
xirang templates

# JSON for programmatic use
xirang templates --json
```

**Output (text):**

```
Schema: semantic-model

Templates:
  proposal  → <package>/schemas/semantic-model/templates/proposal.md
  specs     → <package>/schemas/semantic-model/templates/spec.md
  design    → <package>/schemas/semantic-model/templates/design.md
  tasks     → <package>/schemas/semantic-model/templates/tasks.md
```

---

### `xirang schemas`

List available workflow schemas with their descriptions and artifact flows.

```
xirang schemas [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Example:**

```bash
xirang schemas
```

**Output:**

```
Available schemas:

  semantic-model (package)
    The default semantic-model development workflow
    Flow: proposal → specs → design → tasks

```

---

## Schema Commands

Xirang ships exactly one package-owned schema: `semantic-model`. Project-local and user override schemas are not resolved, and `schema init` and `schema fork` are not available.

### `xirang schema validate`

Validate a schema's structure and templates.

```
xirang schema validate [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Schema to validate (validates all if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed validation steps |
| `--json` | Output as JSON |

**Example:**

```bash
# Validate a specific built-in schema
xirang schema validate semantic-model

# Validate both built-in schemas
xirang schema validate
```

---

### `xirang schema which`

Show the package location of a built-in schema.

```
xirang schema which [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Schema name |

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | List both built-in schemas |
| `--json` | Output as JSON |

**Example:**

```bash
# Check where a schema comes from
xirang schema which semantic-model
```

**Output:**

```
semantic-model resolves from: package
  Source: <package>/schemas/semantic-model
```

**Resolution:**

Both schemas resolve directly from the installed package. Project and user directories do not participate in lookup or shadowing.

---

## Configuration Commands

### `xirang config`

View and modify global Xirang configuration.

```
xirang config <subcommand> [options]
```

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `path` | Show config file location |
| `list` | Show all current settings |
| `get <key>` | Get a specific value |
| `set <key> <value>` | Set a value |
| `unset <key>` | Remove a key |
| `reset` | Reset to defaults |
| `edit` | Open in `$EDITOR` |

**Examples:**

```bash
# Show config file path
xirang config path

# List all settings
xirang config list

# Get a specific value
xirang config get telemetry.enabled

# Set a value
xirang config set telemetry.enabled false

# Set a string value explicitly
xirang config set user.name "My Name" --string

# Remove a custom setting
xirang config unset user.name

# Reset all configuration
xirang config reset --all --yes

# Edit config in your editor
xirang config edit

```

---

## Utility Commands

### `xirang feedback`

Submit feedback about Xirang. Creates a GitHub issue.

```
xirang feedback <message> [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `message` | Yes | Feedback message |

**Options:**

| Option | Description |
|--------|-------------|
| `--body <text>` | Detailed description |

**Requirements:** GitHub CLI (`gh`) must be installed and authenticated.

**Example:**

```bash
xirang feedback "Add support for custom artifact types" \
  --body "I'd like to define my own artifact types beyond the built-in ones."
```

---

### `xirang completion`

Manage shell completions for the Xirang CLI.

```
xirang completion <subcommand> [shell]
```

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `generate [shell]` | Output completion script to stdout |
| `install [shell]` | Install completion for your shell |
| `uninstall [shell]` | Remove installed completions |

**Supported shells:** `bash`, `zsh`, `fish`, `powershell`

**Examples:**

```bash
# Install completions (auto-detects shell)
xirang completion install

# Install for specific shell
xirang completion install zsh

# Generate script for manual installation
xirang completion generate bash > ~/.bash_completion.d/xirang

# Uninstall
xirang completion uninstall
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failure, missing files, etc.) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `XIRANG_TELEMETRY` | Set to `0` to disable telemetry |
| `DO_NOT_TRACK` | Set to `1` to disable telemetry (standard DNT signal) |
| `XIRANG_CONCURRENCY` | Default concurrency for bulk validation (default: 6) |
| `EDITOR` or `VISUAL` | Editor for `xirang config edit` |
| `NO_COLOR` | Disable color output when set |

---

## Related Documentation

- [Commands](commands.md) - AI slash commands (`/xirang:propose`, `/xirang:apply`, etc.)
- [Workflows](workflows.md) - Common patterns and when to use each command
- [Schema Commands](#schema-commands) - Inspect built-in schemas and templates
- [Getting Started](getting-started.md) - First-time setup guide
