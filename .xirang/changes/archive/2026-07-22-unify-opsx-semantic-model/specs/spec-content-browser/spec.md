---
element: presentation.spec_content_panel
---
## MODIFIED Requirements

### Requirement: 条件式 Specs 标签页显示

元素详情 SHALL 根据派生 Spec registry 中该 `elementId` 的 Specs 显示 `Specs` 标签页，MUST NOT 依赖 element `metadata.specs`。

#### Scenario: [ADDED] Element 无 Spec binding
- **WHEN** registry 对当前 element 返回空数组
- **THEN** 详情 SHALL NOT 显示 `Specs` 标签
- **AND** 其他详情标签 SHALL 保持可用

#### Scenario: [ADDED] Element 有 Specs
- **WHEN** registry 返回一个或多个 Spec
- **THEN** 详情 SHALL 显示 `Specs` 标签
- **AND** SHALL 使用 canonical `elementId` 关联内容

#### Scenario: [REMOVED] 元素无 Spec 索引

- **WHEN** 打开的元素不包含 `metadata.specs` 或索引为空
- **THEN** 详情弹窗 SHALL NOT 显示 `Specs` 标签
- **AND** 其他标签页（Properties / Relationships / Views / Structure / Deployments）SHALL 保持可用

#### Scenario: [REMOVED] 元素有 Spec 索引

- **WHEN** 打开的元素包含非空 `metadata.specs` 数组
- **THEN** 详情弹窗 SHALL 显示 `Specs` 标签
- **AND** 标签 SHALL 与其他标签并列显示

### Requirement: 单个 Spec 直接渲染

Element 仅拥有一个 Spec 时，详情 SHALL 直接按需加载并渲染该 Markdown。

#### Scenario: [MODIFIED] 单个 Spec 加载
- **WHEN** 用户打开 `Specs` 标签且 registry 返回一个 Spec
- **THEN** SHALL 显示 project-relative path 与完整 Markdown
- **AND** SHALL NOT 显示 Spec selector

#### Scenario: [MODIFIED] 单个 Spec 缺失
- **WHEN** registry entry 对应文件不存在或不可读
- **THEN** SHALL 在内容区显示 path 与错误
- **AND** SHALL NOT 关闭 element details

### Requirement: 多个 Spec 提供选择器

Element 拥有多个 Specs 时，详情 SHALL 按 registry 的确定性 Spec ID 顺序提供 selector，并默认打开第一项。

#### Scenario: [MODIFIED] 多个 Spec 默认选择
- **WHEN** registry 返回多个 Specs
- **THEN** selector SHALL 按 Spec ID 排序
- **AND** SHALL 默认按需加载第一项

#### Scenario: [MODIFIED] 切换 Spec
- **WHEN** 用户选择另一个 Spec
- **THEN** SHALL 卸载当前内容并加载新内容
- **AND** SHALL 显示新 Spec 的 project-relative path

#### Scenario: [MODIFIED] 多个 Spec 独立错误
- **WHEN** 多个 Specs 中一项加载失败
- **THEN** SHALL 只在该项显示 error
- **AND** 其他 Specs SHALL 可继续切换和加载

### Requirement: 按需安全读取 Spec 文件

服务端 SHALL 根据当前 computed OPSX Semantic Model 的 stable `elementId` 与派生 registry 授权 `.opsx/specs/**/*.md` 读取。请求 path 必须属于该 element 的 registry entries，并通过 project-relative、extension 与 realpath containment 校验。

#### Scenario: [ADDED] Registry 授权校验
- **WHEN** browser 请求 Spec 内容
- **THEN** request SHALL 携带当前 model project ID 与 stable `elementId`
- **AND** server SHALL 重建或读取当前 registry 并验证该 Spec 属于 element
- **AND** SHALL 拒绝不匹配的 element/path pair

#### Scenario: [ADDED] 路径安全
- **WHEN** path 为 absolute、包含 `..`、包含 backslash、不是 `.md` 或 realpath 逃逸 `.opsx/specs/`
- **THEN** server SHALL 拒绝读取

#### Scenario: [MODIFIED] 路径授权校验
- **WHEN** requested path 不属于 registry 中当前 element 的 Specs
- **THEN** server SHALL 拒绝读取
- **AND** SHALL NOT 仅凭 path 存在授权

#### Scenario: [MODIFIED] 符号链接逃逸
- **WHEN** `.opsx/specs/` 下 symlink 的 realpath 指向目录外
- **THEN** server SHALL 拒绝读取

#### Scenario: [MODIFIED] 按需加载
- **WHEN** 用户未打开 `Specs` 标签
- **THEN** SHALL NOT 加载 Spec body
- **AND** SHALL NOT 预载未选中的 Specs

### Requirement: 切换元素清除状态

切换 element 时 SHALL 清除上一个 `elementId` 的 Spec state，并通过新 element 的 registry entries 重新初始化。

#### Scenario: [ADDED] 切换到新 element
- **WHEN** 用户从 element A 切换到 B
- **THEN** SHALL 卸载 A 的 Spec content
- **AND** SHALL NOT 短暂显示 A 的内容
- **AND** B 有 Specs 时 SHALL 按 B 的 registry entries 加载

#### Scenario: [REMOVED] 切换到新元素

- **WHEN** 用户从元素 A 切换到元素 B
- **THEN** 系统 SHALL 卸载元素 A 的 Spec 内容
- **AND** 若元素 B 包含 Spec 索引，SHALL 按新索引重新加载
- **AND** SHALL NOT 短暂显示元素 A 的内容
