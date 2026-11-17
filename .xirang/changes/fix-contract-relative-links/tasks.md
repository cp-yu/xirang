## Goals

- [x] G1: 在三个 Model Selection 中按正文来源正确打开模型内引用
  - Contract: `xirang-contract-delivery` / Section "Business Logic"
  - Contract: `web` / Section "Business Logic"
  - Verify: Semantic Model、Candidate 与 Change 的引用均定位当前所选模型的目标 Contract；文件名与 identity 不同、Change 继承与修改 Section 来自不同目录且 href 相同时仍各自定位正确；原始 ftape 链接打开目标正文而不进入错误 diagram 路由，源 Markdown 和外链行为保持。

- [x] G2: 完成跨 View 阅读、标题定位和就地失败反馈
  - Contract: `xirang-contract-delivery` / Section "Business Logic"
  - Contract: `xirang-contract-delivery` / Section "Edge Cases and Exception Handling"
  - Contract: `web` / Section "Edge Cases and Exception Handling"
  - Verify: 桌面与移动视口中，目标不在当前 View 时仍打开 Contracts 并保持 Model、View、Mode、focus 和图形视口；中文、编码 fragment、同名标题和仅 fragment 引用定位正确；标题缺失时正文可读并提示，目标无法定位或无 Contract 时就地提示且保留页面；后续选择不被旧响应或定位覆盖。

- [x] G3: 保持 Contract 投递的既有保证及展示更新一致性
  - Contract: `xirang-contract-delivery` / Section "Contract source 热更新"
  - Contract: `xirang-contract-delivery` / Section "Key Acceptance Cases"
  - Verify: 源文件位置或引用映射变化而语义不变时，刷新后使用新映射；source 无效保留 last-known-good 呈现；既有 27 个场景对应的加载、只读、安全、身份查找和桌面/移动端行为保持；一次性核对局部业务规格整理保留全部既有承诺。

- [x] G4: 验证 Windows 与 POSIX 的文档路径解析一致性
  - Contract: `xirang-contract-delivery` / Section "Business Logic"
  - Contract: `xirang-contract-delivery` / Section "Key Acceptance Cases"
  - Verify: Windows CI 结果证明原生 Windows 源路径结合 Markdown `/` 引用可定位正确 identity；同一受管相对目录在 macOS/Linux 路径规则下结果一致，大小写遵循宿主文件系统语义，索引外引用不会触发任意文件读取。

## Required Corrections

- [x] [code_fix] 脚注定义按递归发现与首次定义优先规则解析，使嵌套脚注、重复定义和普通正文中的链接 occurrence 始终打开各自对应的目标 Contract。
