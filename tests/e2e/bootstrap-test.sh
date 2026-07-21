#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
PROJECT=$(mktemp -d)
trap 'rm -rf "$PROJECT"' EXIT
mkdir -p "$PROJECT/.opsx"

cat > "$PROJECT/.opsx/project.opsx.yaml" <<'YAML'
schema_version: 2
project:
  id: bootstrap-test
  name: Bootstrap Test
domains:
  - id: dom.core
    type: domain
    intent: Core domain
capabilities:
  - id: cap.core.run
    type: capability
    intent: Run bootstrap
YAML

cat > "$PROJECT/.opsx/project.opsx.relations.yaml" <<'YAML'
schema_version: 2
relations:
  - from: cap.core.run
    type: belongs_to
    to: dom.core
YAML

(
  cd "$PROJECT"
  node "$ROOT/bin/opsx.js" migrate opsx-to-likec4
  node "$ROOT/bin/opsx.js" arch validate
  node "$ROOT/bin/opsx.js" arch query cap.core.run | grep -q 'Element: cap.core.run'
  test -f .opsx/project.opsx.yaml.backup
  test -f .opsx/project.opsx.relations.yaml.backup
)

echo 'Bootstrap Test PASSED'
