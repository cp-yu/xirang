## Why

框架把项目可自定义的 Element Kind 固化进初始化、校验和 Browser 渲染，导致 Metamodel 数据无法成为 Kind 语义的唯一来源；同时 Build 对泛化 Kind 缺少拒绝规则。

## What Changes

- 新项目与 clean Candidate 只播种 Project Root，不注入非 root Element Kinds。
- Validator 与 Semantic Browser 不再按项目 Kind identity 执行框架专用逻辑。
- Build 优先使用能准确表达 Element 的最具体既有 Kind，必要时通过 Metamodel 增补或细化 Kind。
- 共享 fragment 保持不变，不承载项目 Kind 的分解、白名单或示例 identity 语义。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `metamodel`: 移除框架管理内置非 root Element Kind 的行为。
- `project-tooling-configuration`: 移除 setup/update 对项目 Kind 的自动注入与冲突判定。
- `workspace-init`: 将 formal skeleton 收敛为 Project Root Kind 与 Project Root Declaration。
- `semantic-browser`: 移除按特定 Kind identity 改写节点呈现的行为。
- `semantic-model-build`: 要求选择准确 Kind，拒绝仅因可验证而默认使用泛化 Kind。

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

- Model skeleton、setup/update、Semantic Model validator 与 clean Candidate 初始化。
- Semantic Browser 的 Xirang overlay 节点呈现。
- `xirang-build` 生成源与相关测试。
