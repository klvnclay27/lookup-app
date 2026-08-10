import { createServer } from 'node:http';

import { handleRequest } from './app.ts';

const DEFAULT_PORT = 4000;
const configuredPort = Number.parseInt(process.env.PORT ?? '', 10);
const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : DEFAULT_PORT;

const server = createServer(handleRequest);

server.listen(port, () => {
  console.log(`LookUP backend listening on http://localhost:${port}`);
});

function shutDown(signal: string) {
  console.log(`${signal} received. Closing LookUP backend.`);
  server.close((error) => {
    if (error) {
      console.error('LookUP backend could not close cleanly.', error);
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.once('SIGINT', () => shutDown('SIGINT'));
process.once('SIGTERM', () => shutDown('SIGTERM'));
