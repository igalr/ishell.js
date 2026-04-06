import readline from 'readline';
import { ConsoleHandler } from './handlers/console.mjs';

export const localCLI = (target) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        rl.prompt();

        rl.on('line', async (line) => {
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
                process.stderr.write(`Error: ${err.message}\n`);
            }
            rl.prompt();
        });

        rl.on('close', resolve);
    });
};
