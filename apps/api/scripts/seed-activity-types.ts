import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ActivityTypesSeedService } from '../src/modules/crm/activity-types/activity-types-seed.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seed = app.get(ActivityTypesSeedService);
    const result = await seed.seed();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
