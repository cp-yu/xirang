const root = '/tmp/xirang-intent-feasibility-sfdy5q5w';
const scenarios = [
  {key:'understanding',workflow:'explore',turns:[
    '我想更快地找到问题。',
    '具体是本地 CLI 报错后，使用者不知道错在哪。目标是让使用者在30秒内定位到可操作的错误原因；必须离线，不增加服务。仓库证据：现有错误对象已包含错误码和源文件位置，现有文本输出只显示总失败。日志检索和新增缓存都只是候选建议，尚未选择。',
    '补充确认：使用者是开发者，错误码与源文件位置足够给出操作建议，已有映射表覆盖本次范围；目标、范围和约束就是以上内容，现有证据没有未决关键能力。请继续给出设计方向和验证方式。'
  ]},
  {key:'evidence',workflow:'explore',turns:[
    '目标是服务端状态变化后2秒内通知在线用户。我建议每秒轮询。以下项目证据已核实：供应商限制每个账号30秒一次状态查询；其推送接口提供每次状态变化事件，在线交付通常小于1秒。每秒轮询是我的建议，不是必须条件。请讨论方案。',
    '继续评估另一个先前由 Agent 提出并获采纳的后台 worker 路线：原型把待发送任务只放在进程内存，重启会丢失。目标仍是2秒内通知，且不能静默丢消息。发现的就是这项实现假设的问题，请继续设计讨论。',
    '又取得局部实验结果：推送接口单用户、单事件成功，耗时300ms；尚未测试断网恢复、多用户并发或事件顺序。这个结果能支持什么，下一步如何推进？',
    '现在用户明确提出一个新增约束：客户端必须持续离线、没有任何外部通信，但仍要求收到刚发生在远端且无法预知的状态变化并在2秒内通知。请处理这个要求。'
  ]},
  {key:'propose',workflow:'propose',turns:[
    '加一个缓存。我要直接 propose。',
    '没有现成 Summary。已确认问题是同一次 CLI 调用内重复读同一份只读目录清单。目标是同一次调用中相同路径只读取一次，命令退出即丢弃，不跨进程，不需要时间过期；返回目录条目与原实现一致。项目证据：已有 Map 接口与可注入目录读取函数；现有行为测试可验证读取次数和返回结果。缓存是建议，范围只涉及这一次调用内的复用。记录决定已豁免。本次先在对话里形成设计，不写制品。',
    '成文自查的新证据：原实现每次读取后都会原地修改返回数组，初稿却假设缓存数组永远不变。用户目标与范围不变，如何处理这个问题？'
  ]},
  {key:'understanding-repeat',workflow:'explore',turns:[
    '我想更快地找到问题。',
    '具体是本地 CLI 报错后，使用者不知道错在哪。目标是让使用者在30秒内定位到可操作的错误原因；必须离线，不增加服务。仓库证据：现有错误对象已包含错误码和源文件位置，现有文本输出只显示总失败。日志检索和新增缓存都只是候选建议，尚未选择。',
    '补充确认：使用者是开发者，错误码与源文件位置足够给出操作建议，已有映射表覆盖本次范围；目标、范围和约束就是以上内容，现有证据没有未决关键能力。请继续给出设计方向和验证方式。'
  ]}
];
const lanes=[];
for(const scenario of scenarios){for(const variant of ['baseline','candidate'])lanes.push({key:scenario.key+'-'+variant,scenario,variant,runId:null,results:[]});}
for(let round=0;round<4;round++){
  const active=lanes.filter(l=>l.scenario.turns.length>round);
  for(let offset=0;offset<active.length;offset+=4){
    const chunk=active.slice(offset,offset+4);
    const requests=chunk.map(l=>{
      const task=round===0 ? '这是有界的对话行为验证。你直接扮演正在与用户讨论的 '+l.scenario.workflow+' Agent，不要分析或评判测试。先读取 '+root+'/'+l.scenario.workflow+'-'+l.variant+'.md 并按其中提示词回答。该文件是本次唯一工作流指导；忽略文件中的其他本地引用，所需 CLI/模型/项目事实由用户在各轮提供，视为本实验有效投影。只读该文件，不运行其他命令、不写入任何文件、不委托。请用简洁中文正常回答，每轮至多一个关键问题。不要声称运行了任何测试或CLI操作。当前不执行正式制品写入，只讨论设计；这不是整体工作流端到端验收。\n\n用户：'+l.scenario.turns[round] : '用户：'+l.scenario.turns[round];
      const base={key:l.key+'-turn'+(round+1),label:'Observe '+l.key+' turn '+(round+1),task,output:'dialogues/'+l.key+'-turn'+(round+1)+'.md'};
      return round===0 ? {...base,agent:'delegate',cwd:root,model:'llmgw/gpt-6.1-sol'} : {...base,resume:l.runId};
    });
    const results=await runs.all(requests);
    for(let i=0;i<chunk.length;i++){
      const r=results[i];
      if(!r.ok)throw new Error('Dialogue failed '+chunk[i].key+': '+JSON.stringify(r));
      chunk[i].runId=r.runId;
      chunk[i].results.push({turn:round+1,input:chunk[i].scenario.turns[round],output:r.output,outputReference:r.outputReference,artifactPaths:r.artifactPaths,runId:r.runId});
    }
  }
}
return {model:'llmgw/gpt-6.1-sol',setting:'controlled conversational vignettes, full frozen workflow prompt, supplied project facts, no CLI execution',lanes:lanes.map(l=>({key:l.key,variant:l.variant,scenario:l.scenario.key,results:l.results}))};
