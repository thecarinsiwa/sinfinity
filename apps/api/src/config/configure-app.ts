import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  API_GLOBAL_PREFIX,
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
} from './constants';
import { Env } from './env.validation';

export function configureApp(
  app: INestApplication,
  config: ConfigService<Env, true>,
): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX, {
    exclude: [
      { path: SWAGGER_PATH, method: RequestMethod.ALL },
      { path: `${SWAGGER_PATH}/(.*)`, method: RequestMethod.ALL },
      { path: SWAGGER_JSON_PATH, method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });
}
