# Installation

## Prerequisites

- Node.js 22.22.3 or newer
- pnpm 9 or newer
- Git with subtree support

OPSX currently runs from source. It does not publish an npm package and does not download or build LikeC4 from lifecycle hooks.

## Build From Source

```bash
git clone https://github.com/cp-yu/opsx.git
cd opsx
pnpm install --frozen-lockfile
pnpm --dir likec4 install --frozen-lockfile
pnpm --dir likec4 build
pnpm build
node bin/opsx.js --version
```

The root project and `likec4/` are independent pnpm workspaces. Install and build each workspace explicitly. The CLI resolves only `likec4/packages/likec4/bin/likec4.mjs` from the vendored subtree.

For local command access, invoke the repository binary directly or link the built root package with the package manager used by your environment.

## Initialize A Project

```bash
cd your-project
/path/to/opsx/bin/opsx.js init
```

Initialization creates `.opsx/` and installs managed workflow skills for the selected agent tools.

## Verify The Browser

```bash
cd your-project
/path/to/opsx/bin/opsx.js view --port 5173
```

Open `http://localhost:5173`. No external LikeC4 installation is used.

See [Getting Started](getting-started.md) for the workflow and [Supported Tools](supported-tools.md) for agent-specific skill locations.
