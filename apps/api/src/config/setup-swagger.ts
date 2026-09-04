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
import { SWAGGER_TAG_DEFINITIONS } from './swagger-tags';

export function setupSwagger(
  app: INestApplication,
  port: number = DEFAULT_PORT,
): void {
  const builder = new DocumentBuilder()
    .setTitle('Sinfinity API')
    .setDescription('REST API for the Sinfinity platform.')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Local');

  for (const tag of SWAGGER_TAG_DEFINITIONS) {
    builder.addTag(tag.name, tag.description);
  }

  const config = builder
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
