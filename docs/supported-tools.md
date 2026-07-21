# Supported Tools

OPSX works with many AI coding assistants. When you run `opsx init`, OPSX configures selected tools with the fixed managed workflow surface.

## How It Works

For each selected tool, OPSX installs managed skills under the tool's `skills/` directory. Legacy command files may still exist from older installations, but OPSX no longer generates, refreshes, or removes workflow command artifacts.

## Tool Directory Reference

| Tool (ID) | Skills path pattern | Command path pattern |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/opsx-*/SKILL.md` | `.amazonq/prompts/opsx-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/opsx-*/SKILL.md` | `.agent/workflows/opsx-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/opsx-*/SKILL.md` | `.augment/commands/opsx-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/opsx-*/SKILL.md` | `.claude/commands/opsx/<id>.md` |
| Cline (`cline`) | `.cline/skills/opsx-*/SKILL.md` | `.clinerules/workflows/opsx-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/opsx-*/SKILL.md` | `.codebuddy/commands/opsx/<id>.md` |
| Codex (`codex`) | `.codex/skills/opsx-*/SKILL.md` | Not generated (skills-only) |
| Continue (`continue`) | `.continue/skills/opsx-*/SKILL.md` | `.continue/prompts/opsx-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/opsx-*/SKILL.md` | `.cospec/.opsx/commands/opsx-<id>.md` |
| Crush (`crush`) | `.crush/skills/opsx-*/SKILL.md` | `.crush/commands/opsx/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/opsx-*/SKILL.md` | `.cursor/commands/opsx-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/opsx-*/SKILL.md` | `.factory/commands/opsx-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/opsx-*/SKILL.md` | `.gemini/commands/opsx/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/opsx-*/SKILL.md` | `.github/prompts/opsx-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/opsx-*/SKILL.md` | `.iflow/commands/opsx-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/opsx-*/SKILL.md` | `.kilocode/workflows/opsx-<id>.md` |
| Kiro (`kiro`) | `.kiro/skills/opsx-*/SKILL.md` | `.kiro/prompts/opsx-<id>.prompt.md` |
| OpenCode (`opencode`) | `.opencode/skills/opsx-*/SKILL.md` | `.opencode/commands/opsx-<id>.md` |
| Pi (`pi`) | `.pi/skills/opsx-*/SKILL.md` | `.pi/prompts/opsx-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/opsx-*/SKILL.md` | `.qoder/commands/opsx/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/opsx-*/SKILL.md` | `.qwen/commands/opsx-<id>.toml` |
| RooCode (`roocode`) | `.roo/skills/opsx-*/SKILL.md` | `.roo/commands/opsx-<id>.md` |
| Trae (`trae`) | `.trae/skills/opsx-*/SKILL.md` | Not generated (no command adapter; use skill-based `/opsx-*` invocations) |
| Windsurf (`windsurf`) | `.windsurf/skills/opsx-*/SKILL.md` | `.windsurf/workflows/opsx-<id>.md` |

\*\* GitHub Copilot prompt files are recognized as custom slash commands in IDE extensions (VS Code, JetBrains, Visual Studio). Copilot CLI does not currently consume `.github/prompts/*.prompt.md` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools`:

```bash
# Configure specific tools
opsx init --tools claude,cursor

# Configure all supported tools
opsx init --tools all

# Skip tool configuration
opsx init --tools none

```

**Available tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `claude`, `cline`, `codex`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `kilocode`, `kiro`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

## Managed Workflow Skills

OPSX installs the fixed managed workflow skills:
- `opsx-propose`
- `opsx-explore`
- `opsx-apply-change`
- `opsx-archive-change`
- `opsx-bootstrap-arch`
- `opsx-snack`

## Generated Skill Names

OPSX also installs internal supporting skills when required by a workflow template, but those are not user-facing workflow entry points.

See [Commands](commands.md) for command behavior and [CLI](cli.md) for `init`/`update` options.

## Related

- [CLI Reference](cli.md) — Terminal commands
- [Commands](commands.md) — Slash commands and skills
- [Getting Started](getting-started.md) — First-time setup
