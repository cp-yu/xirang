# Supported Tools

Xirang works with many AI coding assistants. When you run `xirang setup`, Xirang configures selected tools with the fixed managed workflow surface.

## How It Works

For each selected tool, Xirang installs managed skills under the tool's `skills/` directory. Legacy command files may still exist from older installations, but Xirang no longer generates, refreshes, or removes workflow command artifacts.

## Tool Directory Reference

| Tool (ID) | Skills path pattern | Command path pattern |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/xirang-*/SKILL.md` | `.amazonq/prompts/xirang-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/xirang-*/SKILL.md` | `.agent/workflows/xirang-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/xirang-*/SKILL.md` | `.augment/commands/xirang-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/xirang-*/SKILL.md` | `.claude/commands/xirang/<id>.md` |
| Cline (`cline`) | `.cline/skills/xirang-*/SKILL.md` | `.clinerules/workflows/xirang-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/xirang-*/SKILL.md` | `.codebuddy/commands/xirang/<id>.md` |
| Codex (`codex`) | `.codex/skills/xirang-*/SKILL.md` | Not generated (skills-only) |
| Continue (`continue`) | `.continue/skills/xirang-*/SKILL.md` | `.continue/prompts/xirang-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/xirang-*/SKILL.md` | `.cospec/.xirang/commands/xirang-<id>.md` |
| Crush (`crush`) | `.crush/skills/xirang-*/SKILL.md` | `.crush/commands/xirang/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/xirang-*/SKILL.md` | `.cursor/commands/xirang-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/xirang-*/SKILL.md` | `.factory/commands/xirang-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/xirang-*/SKILL.md` | `.gemini/commands/xirang/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/xirang-*/SKILL.md` | `.github/prompts/xirang-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/xirang-*/SKILL.md` | `.iflow/commands/xirang-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/xirang-*/SKILL.md` | `.kilocode/workflows/xirang-<id>.md` |
| Kiro (`kiro`) | `.kiro/skills/xirang-*/SKILL.md` | `.kiro/prompts/xirang-<id>.prompt.md` |
| OpenCode (`opencode`) | `.opencode/skills/xirang-*/SKILL.md` | `.opencode/commands/xirang-<id>.md` |
| Pi (`pi`) | `.pi/skills/xirang-*/SKILL.md` | `.pi/prompts/xirang-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/xirang-*/SKILL.md` | `.qoder/commands/xirang/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/xirang-*/SKILL.md` | `.qwen/commands/xirang-<id>.toml` |
| RooCode (`roocode`) | `.roo/skills/xirang-*/SKILL.md` | `.roo/commands/xirang-<id>.md` |
| Trae (`trae`) | `.trae/skills/xirang-*/SKILL.md` | Not generated (no command adapter; use skill-based `/xirang-*` invocations) |
| Windsurf (`windsurf`) | `.windsurf/skills/xirang-*/SKILL.md` | `.windsurf/workflows/xirang-<id>.md` |

\*\* GitHub Copilot prompt files are recognized as custom slash commands in IDE extensions (VS Code, JetBrains, Visual Studio). Copilot CLI does not currently consume `.github/prompts/*.prompt.md` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools`:

```bash
# Configure specific tools
xirang setup --tools claude,cursor

# Configure all supported tools
xirang setup --tools all

# Skip tool configuration
xirang setup --tools none

```

**Available tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `claude`, `cline`, `codex`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `kilocode`, `kiro`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

## Managed Workflow Skills

Xirang installs the fixed managed workflow skills:
- `xirang-propose`
- `xirang-explore`
- `xirang-apply-change`
- `xirang-archive-change`
- `xirang-build`
- `xirang-snack`

## Generated Skill Names

Xirang also installs internal supporting skills when required by a workflow template, but those are not user-facing workflow entry points.

See [Commands](commands.md) for command behavior and [CLI](cli.md) for `setup`/`update` options.

## Related

- [CLI Reference](cli.md) — Terminal commands
- [Commands](commands.md) — Slash commands and skills
- [Getting Started](getting-started.md) — First-time setup
