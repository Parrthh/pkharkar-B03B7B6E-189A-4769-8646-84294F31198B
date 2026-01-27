import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') });
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { SeedService } from './seed.service';

async function runSeed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const seedService = app.get(SeedService);
    await seedService.seed();

    await app.close();
    console.log('Database is seeded successfully');
}

runSeed().catch((err) => {
    console.error('Seeding failed', err);
    process.exit(1);
});