import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { DocumentTypesController } from './document-types/document-types.controller';
import { DocumentTypesSeedService } from './document-types/document-types-seed.service';
import { DocumentTypesService } from './document-types/document-types.service';
import { DocumentsController } from './files/documents.controller';
import { DocumentsService } from './files/documents.service';
import { LocalDiskStorageService } from './storage/local-disk.storage';
import { STORAGE_SERVICE } from './storage/storage.types';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentTypesController, DocumentsController],
  providers: [
    DocumentTypesService,
    DocumentTypesSeedService,
    DocumentsService,
    LocalDiskStorageService,
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService, LocalDiskStorageService],
      useFactory: (
        config: ConfigService<Env, true>,
        local: LocalDiskStorageService,
      ) => {
        const driver = config.get('STORAGE_DRIVER', { infer: true });
        if (driver === 'local') {
          return local;
        }
        return local;
      },
    },
  ],
  exports: [
    DocumentTypesService,
    DocumentTypesSeedService,
    DocumentsService,
    STORAGE_SERVICE,
  ],
})
export class DocumentsModule {}
