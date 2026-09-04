import { Module } from '@nestjs/common';
import { DocumentTypesController } from './document-types/document-types.controller';
import { DocumentTypesSeedService } from './document-types/document-types-seed.service';
import { DocumentTypesService } from './document-types/document-types.service';

@Module({
  controllers: [DocumentTypesController],
  providers: [DocumentTypesService, DocumentTypesSeedService],
  exports: [DocumentTypesService, DocumentTypesSeedService],
})
export class DocumentsModule {}
