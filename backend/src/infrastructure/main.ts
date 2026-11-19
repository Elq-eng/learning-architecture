import 'reflect-metadata';
import { createApp } from './create-app';

async function bootstrap(): Promise<void> {
  const port = Number(process.env.PORT ?? 3001);
  const app = await createApp();
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
