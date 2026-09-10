import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DevSeedService } from '../src/modules/organisation/seeds/dev-seed.service';
import { SEED_DEV_PASSWORD_DEFAULT } from '../src/modules/organisation/seeds/dev-users.catalog';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seed = app.get(DevSeedService);
    const result = await seed.seed();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    // eslint-disable-next-line no-console
    console.log(
      `\nLogin password: ${
        result.passwordSource === 'env'
          ? '(SEED_DEV_PASSWORD)'
          : SEED_DEV_PASSWORD_DEFAULT
      }`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
