import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  DEFAULT_PORT,
  SWAGGER_BEARER_AUTH,
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
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

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
  });
}
