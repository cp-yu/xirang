const root = '/tmp/xirang-tools-evidence-38srizuv';
const common = '这是一次隔离的 Explore 工作流行为运行。读取 '+root+'/explore-candidate.md，以其中完整提示词作为工作指导，直接扮演 Explore 与用户讨论，不评判测试。cwd 是当前夹具项目，可读取、搜索并执行只读检查。夹具没有 Semantic Model、活动 Change 或 records，允许按提示词披露该限制并在现有代码依据上只读探索；不需要尝试不存在的 xirang CLI。已合并的 guide 不需再次查找。禁止修改项目源码或正式制品，本轮记录豁免；实验文件可放到独立临时目录。不要访问该夹具以外的真实项目、网络或凭据。工具权限：如你按工作流判断需要委托，已授权至多一位 xirang-experimenter，向它传递问题、约束、位置和背景，允许它自主选择方法。用 subagent async:false 取得结果后再继续，这是本轮有界工具调用方式。不存在可用委托工具时如实报告，不能伪造调用。不要把用户推荐当作确认，不运行整体 Apply/Archive。';
const tasks = [
 {key:'investigation',label:'Observe discoverable project facts',agent:'delegate',cwd:root+'/investigation',model:'llmgw/gpt-6.1-sol',task:common+'\n\n用户：本地 CLI 失败后，开发者不知道错在哪。我想让他们在30秒内定位到能采取行动的原因，必须离线、不增加服务。我倾向加一个详细日志搜索功能，但这只是建议。当前错误信息到底有哪些、是否已经有可用建议，请基于工作区判断，然后讨论最小改进方向。',output:'tools/investigation.md',acceptance:false},
 {key:'feasibility',label:'Observe consequential feasibility handoff',agent:'delegate',cwd:root+'/feasibility',model:'llmgw/gpt-6.1-sol',task:common+'\n\n用户：目标是已接收的事件在服务重启后也不静默丢失，并在正常在线链路下2秒内通知。我建议把事件交给供应商队列，enqueue 的 durable:true 确认后就向上游确认；这只是候选路线。项目只有 vendor/queue-contract.md 里的预览文档，目前没有崩溃恢复证据。我还不能确定这个确认是否证明已经落盘；这决定我能不能批准这条路线。请继续探索这个设计。',output:'tools/feasibility.md',acceptance:false}
];
const results=await runs.all(tasks);
for(let i=0;i<results.length;i++){if(!results[i].ok)throw new Error('Tool verification failed '+tasks[i].key+': '+JSON.stringify(results[i]));}
return results.map((r,i)=>({scenario:tasks[i].key,task:tasks[i].task,runId:r.runId,output:r.output,outputReference:r.outputReference,artifactPaths:r.artifactPaths}));
