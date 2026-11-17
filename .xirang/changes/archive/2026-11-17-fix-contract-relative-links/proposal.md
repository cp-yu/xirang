## Why

Contracts 正文中的相对 Markdown 证据链接按当前网页 URL 解析，点击 `ftape-linux-timing.md` 会进入 `/view/full-model/ftape-linux-timing.md` 并显示 diagram 不存在，目标证据文件却实际存在。需要让正文引用正确打开目标 Contract，使用户能连续阅读分析和证据。

## What Changes

- 在展示数据生成时解析模型内相对文档引用，以目标 Element identity 导航，保持源 Markdown 和外部网页链接的既有用法。
- 支持在当前 View 外打开目标 Contracts、标题锚点定位，以及目标或标题缺失时的就地提示。
- 保持 Semantic Model、Candidate 与 Change 目标内容的来源一致，并使文件位置或链接映射变化触发展示刷新。
- 将 `xirang-contract-delivery` 局部整理为业务规格 Contract，保留既有加载、安全、只读、异步、热更新及视口承诺。

## Source Impact

### Behavior Source

#### New Specs

None。

#### Modified Specs

- `xirang-contract-delivery`：本地引用解析、按 identity 打开 Contracts、锚点与异常提示、跨平台路径处理和展示刷新；整理完整 Contract 的业务规格结构并保留既有承诺与验收内容。
- `web`：在浏览器自身层级表达正文链接的跨 View 阅读、当前图形保持、锚点及失败反馈保证，并补充相应验收案例。

### Architecture Source

#### Added Elements

None。

#### Modified Elements

- `xirang-contract-delivery`：Kind 从 `element` 改为已有的 `browser-specification`，identity、parent、title 和完整 Definition 保持不变。

#### Removed Elements

None。

#### Architecture Relations

None。Element Kinds、Relationship Kinds、Relationships 与 Authored Views 均无变更。

## Impact

- Xirang Browser runtime 的 Contract 投影、来源索引和缓存指纹。
- 嵌入式 LikeC4 的 Contract transport、Contracts 渲染、详情导航与标题定位。
- 两个 Element 的 Section Delta，以及 `xirang-contract-delivery` 的 Declaration Delta。
- 不改写用户源 Markdown，不增加任意文件读取服务，不扩展到非 Element 文档浏览；故障反馈为界面提示。
