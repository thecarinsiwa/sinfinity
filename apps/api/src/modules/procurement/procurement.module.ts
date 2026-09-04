import { Module } from '@nestjs/common';
import { ProcurementQuotesController } from './procurement-quotes/procurement-quotes.controller';
import { ProcurementQuotesService } from './procurement-quotes/procurement-quotes.service';
import { ProcurementRequestsController } from './procurement-requests/procurement-requests.controller';
import { ProcurementRequestsService } from './procurement-requests/procurement-requests.service';

@Module({
  controllers: [ProcurementRequestsController, ProcurementQuotesController],
  providers: [ProcurementRequestsService, ProcurementQuotesService],
  exports: [ProcurementRequestsService, ProcurementQuotesService],
})
export class ProcurementModule {}
