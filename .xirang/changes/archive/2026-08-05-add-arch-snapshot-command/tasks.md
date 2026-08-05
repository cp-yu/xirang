### Task 1: 实现 arch snapshot 命令

**Goal**: 新增 `xirang arch snapshot` 命令，输出整个 Semantic Model 骨架（Element Declarations 嵌套树 + Relationships + Metamodel Kinds），支持 text/markdown/json 三格式，供 Agent 作为项目模型总览注入上下文。

**Files**:
- Create: `src/commands/arch/snapshot.ts`
- Modify: `src/commands/arch/index.ts`
- Test: `test/commands/arch-snapshot.test.ts`

**Requirements**:
- `xirang arch snapshot` SHALL 输出全部 Element Declarations（identity、kind、definition）、全部 Relationships 与 Metamodel Kinds（含定义），且 SHALL NOT 包含任何 Contract 内容。
- 元素树 SHALL 以嵌套树呈现（缩进隐含 parent），节点行显示 identity、kind（非默认时）与 definition，title 与 parent 不出现在节点行。
- 命令 SHALL 支持 `--format text`（默认，box-drawing 树）/ `markdown` / `json` 三格式，从同一模型投影生成。
- 命令 SHALL 只处理 Formal Semantic Model，只读、不提供 `--change`/`--code`；模型缺失或校验失败非零退出。

#### Checks

- [x] C1 快照输出完整骨架且不含 Contract
  - Verifies: `elements/arch-snapshot.md` / Requirement "snapshot SHALL 输出完整模型骨架" / Scenario "输出全部 Element Declarations"
  - Command: `pnpm build && node bin/xirang.js arch snapshot --format json | python3 -c "import json,sys; d=json.load(sys.stdin); assert 'elements' in d and 'relations' in d and 'metamodel' in d; assert len(d['elements']) == 153 and len(d['relations']) == 50"`
  - Expect: 输出包含全部元素、关系与 metamodel，且无 Requirements 字段
- [x] C2 元素树嵌套与字段规则
  - Verifies: `elements/arch-snapshot.md` / Requirement "snapshot SHALL 以嵌套树表达层级" / Scenario "嵌套隐含 parent"
  - Command: `pnpm build && node bin/xirang.js arch snapshot | grep -E "project.root|semantic-objects|completion-command" && ! node bin/xirang.js arch snapshot | grep -E "\| title"`
  - Expect: 文本树以 project.root 为根、children 缩进、节点含 (kind) 与 definition、不含 title 字段
- [x] C3 三格式输出
  - Verifies: `elements/arch-snapshot.md` / Requirement "snapshot SHALL 支持 text / markdown / json 三格式" / Scenario "默认 text 格式"
  - Command: `pnpm build && node bin/xirang.js arch snapshot > /tmp/s.txt && node bin/xirang.js arch snapshot --format markdown > /tmp/s.md && node bin/xirang.js arch snapshot --format json > /tmp/s.json && grep -c "└──\|├──" /tmp/s.txt && grep -c "^- " /tmp/s.md && python3 -c "import json; json.load(open('/tmp/s.json'))"`
  - Expect: text 含 box-drawing 分支，markdown 为 `- ` 嵌套列表，json 可解析
- [x] C4 只读与错误语义
  - Verifies: `elements/arch-snapshot.md` / Requirement "snapshot SHALL 只处理 Formal Semantic Model" / Scenario "模型缺失失败"
  - Command: `pnpm build && cd /tmp && mkdir -p empty-xirang && cd empty-xirang && node /home/yunxin/Documents/Code/tools/developmentFramework/OpenSpec/bin/xirang.js arch snapshot; echo "exit=$?"`
  - Expect: 无模型时非零退出并报告错误，且不创建任何文件

### Task 2: 更新共享 XIRANG_SHARED_CONTEXT fragment

**Goal**: 在 `XIRANG_SHARED_CONTEXT` fragment 增加 snapshot 总览指引，使六个 workflow skill 在启动时先注入项目模型骨架再按需点查 Contract。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Test: `test/skills/`（受管 skill 生成测试，若需断言）

**Requirements**:
- `XIRANG_SHARED_CONTEXT` fragment SHALL 指引 Agent 先运行 `xirang arch snapshot` 注入完整模型骨架（全部 Element Declarations、Relationships 与 Metamodel Kinds，不含 Contract），再以 `xirang arch query <identity> --relations --depth <n> --json` 加 `--contract` 按需点查。
- 该指引 SHALL 位于 `arch query` 指引之前，作为模型总览的首次注入步骤。

#### Checks

- [x] C5 fragment 包含 snapshot 指引
  - Verifies: `elements/workflow-templates.md` / Requirement "统一加载协议与优雅降级" / Scenario "Shared context 先注入模型骨架总览"
  - Command: `grep -n "arch snapshot" src/core/templates/fragments/xirang-fragments.ts`
  - Expect: `XIRANG_SHARED_CONTEXT` 中含 `xirang arch snapshot` 指引行且位于 arch query 指引之前
- [x] C6 生成测试通过
  - Verifies: `elements/workflow-templates.md` / Requirement "统一加载协议与优雅降级" / Scenario "Templates 使用同一 fragment"
  - Command: `pnpm test test/skills`
  - Expect: 生成 skill 内容断言全部通过

### Task 3: 集成测试与跨平台验证

**Goal**: 在集成测试中覆盖 `xirang arch snapshot` 的 CLI 行为，并验证跨平台路径处理。

**Files**:
- Modify: `test/integration/arch-command.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- CLI 层 `runCLI(['arch','snapshot'])` SHALL 默认输出 text、`--format json` 输出结构化 JSON、模型缺失时非零退出。
- 读取与输出 SHALL 使用 Node.js path utilities，测试使用 `path.join()` 构造期望路径。

#### Checks

- [x] C7 CLI 集成三格式
  - Verifies: `elements/arch-snapshot.md` / Requirement "snapshot SHALL 支持 text / markdown / json 三格式" / Scenario "json 格式"
  - Command: `pnpm test test/integration/arch-command.test.ts`
  - Expect: `runCLI(['arch','snapshot'])` 默认 text、`--format json` 输出可解析 JSON、无模型时 exitCode 非零
- [x] C8 跨平台路径
  - Verifies: `elements/arch-snapshot.md` / Requirement "snapshot SHALL 只处理 Formal Semantic Model" / Scenario "命令保持只读"
  - Command: `pnpm test test/integration/arch-command.test.ts`
  - Expect: 测试用 `path.join` 构造路径，Windows/macOS/Linux 行为一致
