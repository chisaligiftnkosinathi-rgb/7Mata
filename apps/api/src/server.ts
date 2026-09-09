import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';

const app = Fastify({
  logger: true,
  trustProxy: true,
});

await app.register(helmet);
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false,
  credentials: true,
});
await app.register(sensible);

app.get('/health', async () => ({
  status: 'ok',
  service: '7mata-api',
  timestamp: new Date().toISOString(),
}));

app.get('/ready', async (_request, reply) => {
  // TODO: Add database and Redis readiness checks.
  return reply.send({
    status: 'ready',
  });
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  await app.listen({ port, host });
}

export { app };
