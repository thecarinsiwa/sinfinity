import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './config/configure-app';
import { Env } from './config/env.validation';
import { setupSwagger } from './config/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const config = app.get(ConfigService<Env, true>);

  configureApp(app, config);
  setupSwagger(app, config.get('PORT', { infer: true }));

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
