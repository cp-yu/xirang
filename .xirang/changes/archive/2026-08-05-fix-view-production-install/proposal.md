## Why

`scripts/build_and_install.sh` 完成全局安装后运行 `xirang view` 报错 "LikeC4 dist is stale and tsx is unavailable"；消除该错误后浏览器页面又因部署缺少 `@likec4/generators` 运行时依赖而无法加载。官方安装流程产出的 CLI 无法使用 Semantic Browser。

## What Changes

使生产安装下的 `xirang view` 从随包部署的 LikeC4 dist 启动嵌入式浏览器服务，不要求 workspace 源码或 tsx；将内嵌浏览器运行时的 `@likec4/generators` 依赖纳入生产依赖并同步 lockfile；扩展打包安装测试，在临时目录复现 `pnpm deploy --legacy --prod` 部署布局并验证 dist 启动、运行时依赖与 CLI 可执行。

## Source Impact

### Behavior Source

#### New Specs

- `cli`: 新增 Requirement 约束生产安装下 `xirang view` 从随包 LikeC4 dist 启动嵌入式服务，且不因缺少 workspace 源码或 tsx 失败

#### Modified Specs

- None

### Architecture Source

- None

## Impact

- `src/commands/arch/runner.ts`: LikeC4 CLI 启动解析——生产部署缺少 workspace 源码时直接使用随包 dist
- `likec4/packages/likec4/package.json` 与 `likec4/pnpm-lock.yaml`: `@likec4/generators` 从 `devDependencies` 移入 `dependencies`
- `scripts/test-packed-install.mjs`: 临时目录复现生产部署并验证运行解析、运行时依赖与 CLI
- 测试: `test/core/likec4/runner-staleness.test.ts`、`test/cli-e2e/basic.test.ts`
