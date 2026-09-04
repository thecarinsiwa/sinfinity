import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  DEFAULT_PORT,
  SWAGGER_BEARER_AUTH,
  SWAGGER_JSON_PATH,
  SWAGGER_JSON_PATH_ALIAS,
  SWAGGER_PATH,
  SWAGGER_PATH_ALIAS,
} from './constants';

export function setupSwagger(
  app: INestApplication,
  port: number = DEFAULT_PORT,
): void {
  const config = new DocumentBuilder()
    .setTitle('Sinfinity API')
    .setDescription('REST API for the Sinfinity platform.')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Local')
    .addTag('Health', 'Liveness and readiness')
    .addTag(
      'Settings',
      'Global reference data: geography, currencies, taxes, units, commercial terms',
    )
    .addTag(
      'Organisation',
      'Tenants, branches, users and organization-level settings',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token',
      },
      SWAGGER_BEARER_AUTH,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerOptions = {
    swaggerOptions: { persistAuthorization: true },
  };

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    ...swaggerOptions,
    jsonDocumentUrl: SWAGGER_JSON_PATH,
  });

  SwaggerModule.setup(SWAGGER_PATH_ALIAS, app, document, {
    ...swaggerOptions,
    jsonDocumentUrl: SWAGGER_JSON_PATH_ALIAS,
  });
}
