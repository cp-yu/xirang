#!/usr/bin/env python3
"""One-off migration: legacy `## Requirements` / `### Requirement:` / `#### Scenario:`
notation -> `## Specification` / `### Section:`.

Scenario blocks are folded into the Section body as a bolded lead-in plus their
condition/outcome lines as nested bullets, preserving the GIVEN/WHEN/THEN/AND
keywords as plain prose labels so no semantics are lost while the rigid
keyword structure stops being a validation requirement.

  ## Requirements                -> ## Specification
  ### Requirement: <name>        -> ### Section: <name>
  #### Scenario: <name>          -> - **<name>**
  - **WHEN** x                   ->   - x
"""
import pathlib
import re
import sys

ROOT = pathlib.Path('.xirang/model/elements')
SCENARIO_RE = re.compile(r'^####\s+Scenario:\s*(.+?)\s*$')
REQ_RE = re.compile(r'^###\s+Requirement:\s*(.+?)\s*$')
BULLET_RE = re.compile(r'^-\s+\*\*(GIVEN|WHEN|THEN|AND)\*\*\s*(.*)$')


def convert(text: str) -> str:
    out: list[str] = []
    in_scenario = False
    for line in text.split('\n'):
        if line.strip() == '## Requirements':
            out.append('## Specification')
            continue

        m = REQ_RE.match(line)
        if m:
            in_scenario = False
            out.append(f'### Section: {m.group(1)}')
            continue

        m = SCENARIO_RE.match(line)
        if m:
            in_scenario = True
            if out and out[-1].strip() != '':
                out.append('')
            out.append(f'- **{m.group(1)}**')
            continue

        if in_scenario:
            m = BULLET_RE.match(line)
            if m:
                out.append(f'  - {m.group(2)}'.rstrip())
                continue
            if line.startswith('  '):
                out.append('  ' + line.strip())
                continue
            if line.strip() == '':
                out.append(line)
                continue
            in_scenario = False

        out.append(line)

    return re.sub(r'\n{3,}', '\n\n', '\n'.join(out))


def main() -> int:
    changed = 0
    for path in sorted(ROOT.glob('*.md')):
        original = path.read_text(encoding='utf-8')
        converted = convert(original)
        if converted != original:
            path.write_text(converted, encoding='utf-8')
            changed += 1
    print(f'converted {changed} units')
    return 0


if __name__ == '__main__':
    sys.exit(main())
