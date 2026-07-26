---
element: cap.ai.sweeper-terminology-extraction
---

## REMOVED Requirements

### Requirement: 术语提取触发条件
**Reason**: Explore 不再调用 Sweeper 或消费 Sweeper terminology stage。

**Migration**: Explore 根据 `arch search` 结果和 Architecture context 执行普通术语澄清。

### Requirement: 语义相近术语识别
**Reason**: CLI 明确不执行同义词或 semantic similarity 推断。

**Migration**: Agent MAY 调整确定性 search query，但不维护专用术语提取 capability。

### Requirement: 术语统计与分布追踪
**Reason**: Spec 术语出现次数不再作为 impact protocol 的独立输出。

**Migration**: `arch search` 返回实际命中字段与文本，不统计近义词分布。

### Requirement: 复合术语处理
**Reason**: Sweeper 专属复合术语推断被删除。

**Migration**: Explore 根据 Architecture project terminology 向用户澄清。

### Requirement: Prompt 指令规范
**Reason**: 不再生成 Impact Sweeper prompt。

**Migration**: Explore workflow 直接声明 CLI semantic navigation 与普通澄清纪律。

### Requirement: 术语提取失败时的降级行为
**Reason**: 术语提取阶段不存在，因此无需专用降级协议。

**Migration**: `arch search` 无匹配时正常返回空结果，由 Explore 决定下一次查询或提问。
