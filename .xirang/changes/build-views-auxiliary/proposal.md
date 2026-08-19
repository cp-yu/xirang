## Why

Build 把 Authored Views 写成必做最后一层，Agent 会整层重写或被旧 view 束缚。Views 只是呈现辅助，不应挡住规范性模型完成后的 validate / review / promote。

## What Changes

Semantic Model Build 的完成门禁改为 Metamodel + Elements/Contracts + Relationships；`views/` 只需是真实目录。不要求编写、保留或非空 Authored Views。不改 `candidate init`、不改 Browser、不加新 CLI 校验。已有 `UNRESOLVED_VIEW_REFERENCE` 仍对分区内已有 view 单元生效。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-model-build`：完整 Candidate、Decision Gate、BFS 编写层与语义审查不再把 Authored Views 当作完成条件；审查不得因无 authored view 或正式 view 未保留而 FAIL

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `src/core/templates/workflows/build.ts`：去掉 Authored Views 必写完成层与审查失败条件
- `test/core/templates/build.test.ts`：锁定 skill 不再把 Authored Views 列为必写完成层
- 生成面：`xirang update --force` 同步的 `xirang-build` skill
- 不改 `src/core/model/validator.ts`、`src/core/candidate/`、Browser
