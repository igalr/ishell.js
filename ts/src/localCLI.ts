import readline from 'readline';
import { ConsoleHandler } from './handlers/console.js';
import type { APIInterface } from './API.js';

export const localCLI = (target: APIInterface): Promise<void> => {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    rl.prompt();

    rl.on('line', async (line: string) => {
      line = line.trim();
      if (!line) {
        rl.prompt();
        return;
      }
      if (line === 'exit' || line === 'quit') {
        rl.close();
        return;
      }
      try {
        const { path, params, body } = ConsoleHandler.parse(line);
        const method = await target.resolveMethod(path);
        const handler = new ConsoleHandler(path, params, method, body);
        const response = await target.execute([...path], params, method, body, handler.headers);
        handler.processResponse(response);
      } catch (err) {
        process.stderr.write(`Error: ${(err as Error).message}\n`);
      }
      rl.prompt();
    });

    rl.on('close', resolve);
  });
};
