## Context

`xirang view` 通过 `src/commands/arch/runner.ts` 的 `resolveLikeC4Command` 决定如何启动嵌入式 LikeC4 CLI：开发时启用源码陈旧检测，dist 陈旧时以 tsx 从源码运行。`scripts/build_and_install.sh` 全局安装后，安装包内 `likec4/` 被替换为 `pnpm deploy --legacy --prod` 的产物，只包含打包后的 `likec4/packages/likec4`（bin/dist/__app__），不含 workspace 源码与 tsx。旧实现把“缺少 workspace 源码的包”仍按“缺少 dist”判为陈旧，进而尝试调用生产安装中不存在的 tsx，导致 `xirang view` 直接失败。消除该错误后，内嵌 SPA（`__app__/src/main.mjs`）在运行时导入 `@likec4/generators`（`buildViewTree`/`renderTreeMarkdown`/`treeToJson`），而该包此前位于 `devDependencies`，`pnpm deploy --prod` 不部署 dev 依赖，页面因此无法解析导入。

## Goals / Non-Goals

Goals:

- 生产安装后 `xirang view` 从随包 dist 启动并正常提供浏览器页面
- 保持开发工作区既有陈旧检测与 tsx 源码回退行为不变
- 自动化打包安装测试复现生产部署布局，防止回归

Non-Goals:

- 不改变开发工作区的构建流程或 `pnpm likec4:build` 命令面
- 不将浏览器渲染行为或投影语义纳入本 Change

## Decisions

### 陈旧检测仅覆盖存在源码的包

在 `isLikeC4DistStale` 中对每个 CLI runtime 包先检查 `src/` 是否存在；生产部署缺少 workspace 源码时跳过该包，不再把“缺少 dist”误判为陈旧。替代方案是在生产环境设置 `XIRANG_LIKEC4_STALE_CHECK=0` 关闭检测，但该方案依赖部署环境变量约定且会让开发工作区行为分叉；按“是否存在源码”判别与部署布局直接一致。

### `@likec4/generators` 归入生产依赖

将 `likec4/packages/likec4` 的 `@likec4/generators` 从 `devDependencies` 移入 `dependencies`，使 `pnpm deploy --legacy --prod` 部署该运行时依赖。它被 `__app__/src/main.mjs` 直接导入，属于内嵌浏览器的运行时依赖；用 `pnpm --dir likec4 install --lockfile-only --offline` 同步 lockfile，仅移动 importer 分区，不引入版本变化。

### 打包安装测试复现生产部署

`scripts/test-packed-install.mjs` 在临时目录安装 tarball 后，删除其中 `likec4/`，执行与 `scripts/build_and_install.sh` 一致的 `pnpm --dir likec4 --filter xirang-likec4 deploy --legacy --prod`，再断言：安装版 runner 解析为 `dist`、`@likec4/generators` 已部署、`likec4.mjs --help` 可执行。该测试不改动全局安装环境。

## Risks / Trade-offs

- [生产部署仍缺少某运行时依赖时，浏览器页面在构建阶段报解析错误] → 打包安装测试断言关键运行时依赖存在，且部署与安装脚本共用同一命令，降低漂移
- [开发工作区布局异常（如 `src` 存在但 `dist` 缺失）仍会回退源码模式] → 这是既有保护行为，仅当 tsx 不可用时才报错，与本次变更不冲突

## Migration Plan

- 重新运行 `scripts/build_and_install.sh` 完成全局安装；新安装的 CLI 即采用 dist 启动
- 回滚：恢复 `@likec4/generators` 到 `devDependencies` 并重新构建安装

## Open Questions

- None
