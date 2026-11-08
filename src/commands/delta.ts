import type { Command } from 'commander';
import { WritebackError, writebackExpectedModel } from '../core/expected-model-writeback.js';

export function registerDeltaCommand(program: Command): void {
  program.command('delta').description('管理 Semantic Delta 内容')
    .command('writeback <change>')
    .description('将 stdin 中支持的 Expected Semantic Model 微调写回 Delta 源文件')
    .requiredOption('--source <path>', '审阅投影返回的 Delta 源文件路径')
    .option('--json', '输出结构化写回结果')
    .action(async (change: string, options: { source: string; json?: boolean }) => {
      try {
        if (process.stdin.isTTY) throw new WritebackError('INVALID_INPUT', '请从 stdin 提交完整目标模型文本。');
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const result = await writebackExpectedModel(process.cwd(), change, options.source, Buffer.concat(chunks).toString('utf8'));
        console.log(JSON.stringify({ ok: true, ...result, diagnostics: [] }));
      } catch (error) {
        process.exitCode = 1;
        console.log(JSON.stringify({ ok: false, code: error instanceof WritebackError ? error.code : 'WRITEBACK_FAILED',
          message: error instanceof Error ? error.message : String(error),
          diagnostics: error instanceof WritebackError ? error.diagnostics : [],
        }));
      }
    });
}
