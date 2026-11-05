---
entity: element-declaration
identity: validation-commands
kind: element
parent: deterministic-operations
title: Validation Commands
definition: Validation Commands 定义 `xirang validate` 命令面的校验契约：顶层 validate 的选择与批量模式、显式 full-Change validation 与 concise preview、Section 交叉校验、fence-aware Section 读取与 effective preview。
---

## MODIFIED Sections

### Section: 任务计划文件冲突检测

validate 命令 SHALL 只接受目标级 `tasks.md`，检查每个任务具有目标、可观察验证方向及目标级完成状态，不要求列文件或可执行 Check。旧式 `Files` 声明不再解析或参与互斥文件冲突检测；旧格式需要使用前必须重写。

- **新格式不预列文件**
  - tasks.md 只有目标与验证方向
  - 校验 SHALL 不报告缺少 Files，也不推测文件冲突

- **旧格式不受支持**
  - tasks.md 使用 `Files`/`Sections`/`Checks` 或 Actions/Checks 布局而非目标级格式
  - validation SHALL 报告格式错误并要求重写，不尝试兼容解析

### Section: 任务依赖顺序检测

validate 命令 SHALL 接受不预列文件或技术依赖的目标级 tasks，不从任务自然排列推断用户指定次序或技术依赖；用户指定次序由 Propose 与 Apply 依据确认来源和 Plan 审查。CLI 不提供基于旧式 Files 声明的任务依赖顺序检测。

- **不推断目标顺序语义**
  - tasks.md 列出多个目标
  - CLI SHALL 不从排列判断用户要求或技术依赖

### Section: Check 锚点与 Acceptance Case 标题匹配

validate 命令 SHALL 在目标级 tasks 中核对验证方向所指的 Element identity 和 Section 是否存在于目标或正式 Contract，不要求每项结果都指向一个 Acceptance Case，也不把 Acceptance Case 数量当作 Check 数量；不支持旧式 `Verifies:` / `Preserves:` Check 锚点。

- **目标级语义定位**
  - 目标任务引用目标 Contract 的 Element identity 与 Section
  - CLI SHALL 接受合法定位，拒绝不存在的身份或 Section，不要求文件路径式锚点

### Section: Check 测试动作校验

validate 命令 SHALL 对目标级 tasks 检查目标及验证方向非空、每项目标具有一个可更新的完成状态；SHALL NOT 要求预先声明 `Test action:`、`Command:`、`Evidence:`、`Expect:` 或 nested Check。旧式 coarse Tasks 与 Actions/Checks 布局不受支持，SHALL 报格式错误而非继续执行旧 Check 校验。

- **目标级任务**
  - tasks.md 采用目标级布局
  - CLI SHALL 接受目标和验证方向非空、完成状态可勾选的任务，不要求旧式 Check 字段

- **旧格式被拒绝**
  - tasks.md 使用旧式 `Files`/`Sections`/`Checks` 或 Actions/Checks 布局
  - CLI SHALL 报不支持格式并要求重写，不对其推测或部分解析
