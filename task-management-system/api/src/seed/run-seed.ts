import 'dotenv/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app/app.module';
import { SeedService } from './seed.service';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seed = app.get(SeedService);
    await seed.seed(); // ✅ call the explicit seed() method
    console.log('✅ Seed finished');
  } catch (err) {
    console.error('Seeding failed', err);
  } finally {
    await app.close();
  }
}

runSeed();
