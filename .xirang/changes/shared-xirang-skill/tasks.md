## Goals

- [ ] G1: 所有受管阶段入口都能取得公共基础与当前所需专项指导
  - Contract: `agent-workbench-projection` / Section "使用共享生成引擎"
  - Verify: 安装与更新交付可达的 common 和阶段入口，六个阶段集合保持一致；不同工具及 Windows、macOS、Linux 路径下依赖可达、用户文件不受影响，Windows CI 提供跨平台验证证据。

- [ ] G2: 用户可从公共入口或直接阶段入口进入工作流并安全复用指导
  - Contract: `workflow-templates` / Section "阶段选择与公共指导复用"
  - Verify: 自然语言意图进入对应阶段，阶段首入补齐 common 并保留阶段；连续切换不重复读取有效指导，失效或独立 Agent 补读必要内容，不循环加载、不跳过门禁。

- [ ] G3: 公共与专项规则以唯一来源按需交付且语义完整
  - Contract: `agent-workbench-projection` / Section "物化共享片段与 references"
  - Verify: common、阶段 skill 和 references 各承载约定内容；完整规则无重复维护，所有消费者仍可取得必要指导，不预加载无关协议，动态状态检查继续有效；相同场景的实际读取量能说明消除的重复内容。

- [ ] G4: 形成与实施指导一致采用目标级任务及动态测试安排
  - Contract: `workflow-templates` / Section "Workflow Skills 声明 Internal Subagents 约束"
  - Verify: Propose 和相关 references 形成的 tasks 仅表达目标、Contract 与验证方向；测试动作由 Apply 根据当前项目决定，阶段交接支持自然语言进入且保留原有准备与确认门禁。
