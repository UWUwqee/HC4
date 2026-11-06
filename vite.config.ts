import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import path from 'path';
import {defineConfig} from 'vite';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

function appointmentsApiDevPlugin(): Plugin {
  return {
    name: 'appointments-api-dev',
    configureServer(server) {
      const createApiMiddleware = (modulePath: string, maxBodySize = 1_048_576) => {
        return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
          void next;
          try {
            const apiRequest = request as typeof request & { body?: unknown; headers: IncomingHttpHeaders };
            if (request.method === 'POST') {
              const chunks: Buffer[] = [];
              let size = 0;
              for await (const chunk of request) {
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                size += buffer.length;
                if (size > maxBodySize) {
                  response.statusCode = 413;
                  response.setHeader('Content-Type', 'application/json');
                  response.end(JSON.stringify({ error: 'Request is too large.' }));
                  return;
                }
                chunks.push(buffer);
              }
              if (chunks.length > 0) {
                try {
                  apiRequest.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                } catch {
                  apiRequest.body = undefined;
                }
              }
            }
            const apiResponse = response as typeof response & {
              status: (code: number) => typeof response;
              json: (body: unknown) => void;
            };
            apiResponse.status = (code) => {
              response.statusCode = code;
              return response;
            };
            apiResponse.json = (body) => {
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(body));
            };
            const { default: handler } = await server.ssrLoadModule(modulePath);
            await handler(apiRequest, apiResponse);
          } catch (error) {
            console.error(`API route error for ${modulePath}:`, error);
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ error: 'Internal server error.' }));
          }
        };
      };

      server.middlewares.use('/api/admin', createApiMiddleware('/api/admin.ts'));
      server.middlewares.use('/api/health-data', createApiMiddleware('/api/health-data.ts'));
      server.middlewares.use('/api/appointments', createApiMiddleware('/api/appointments.ts'));
      server.middlewares.use('/api/content-image', createApiMiddleware('/api/content-image.ts'));
      server.middlewares.use('/api/content', createApiMiddleware('/api/content.ts'));
      server.middlewares.use('/api/reminders', createApiMiddleware('/api/reminders.ts'));
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), appointmentsApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
