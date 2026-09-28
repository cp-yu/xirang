---
entity: element-declaration
identity: mechanism-expression-authoring
kind: element
parent: section
title: Mechanism Expression Authoring
definition: Mechanism Expression Authoring 定义 Section 中表达业务机制的载体规范：载体不受封闭枚举限制，伪代码、决策表、公式表与事件三元组是常见形态的提示而非强制；伪代码块标注 `pseudocode` 语言、标识符引用稳定 identity，且验证器不强制校验载体语法。
---

## Specification

### Section: 载体不受封闭枚举限制

Section 表达业务机制时 MAY 使用任何能完整、无二义表达该机制的载体，并 SHALL NOT 被限定为固定几种形式。

- **规程型**（跨系统、步骤严密）MAY 使用结构化伪代码，采用中性动词、统一缩进与条件分支表述。
- **规则判定型**（多维度交叉条件）MAY 使用决策表，避免多层嵌套条件语句。
- **计算派生型**（金额、积分、分段计价）MAY 使用数学公式与输入输出依赖表，而非循环累加描述。
- **事件驱动型**（响应外部通知）MAY 使用「监听到事件 → 检查前置 → 触发动作」三元组。
- 以上四者是常见形态的提示而非枚举；项目以状态机、时序图、矩阵或结构化数据等更贴合语义的形式表达机制时，规范接受该载体。

### Section: 载体不得退化为语言级代码

Section 正文 SHALL NOT 直接搬运编程语言语句，SHALL NOT 使用语言级类型声明、解析调用、遍历下标或指针表达业务机制。

- 载体应当去除语法噪音，保留业务语义而非机器语言细节。

### Section: 载体标识符引用稳定 identity

载体中的标识符 SHALL 引用 Semantic Model 中的稳定 Element identity。

- 引用模型元素时 SHALL 使用稳定 identity（如 `apply`、`quality`）；示例：`apply.execute()`、`quality.review()`。
- Agent 读取载体中的点分标识符时 SHALL 将其作为 identity 查询，SHALL NOT 从 dot segments 猜测固定层级。

### Section: 组内允许混合载体

一个 Section SHALL 允许同时使用多种载体表达同一大点的不同方面。

- 某 Section 既有步骤序列又有判定规则时，MAY 同时包含伪代码块与决策表。

### Section: 载体语法不参与验证

Xirang 验证 MUST NOT 强制验证伪代码、决策表、公式或其它载体的语法。

- Contract 包含伪代码块或决策表时，MUST NOT 解析或校验其语法；载体仅作为人类和 Agent 可读的规范表达。
