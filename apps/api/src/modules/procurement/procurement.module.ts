import { Module } from '@nestjs/common';
import { ProcurementApprovalsController } from './procurement-approvals/procurement-approvals.controller';
import { ProcurementApprovalsService } from './procurement-approvals/procurement-approvals.service';
import { ProcurementComparisonsController } from './procurement-comparisons/procurement-comparisons.controller';
import { ProcurementComparisonsService } from './procurement-comparisons/procurement-comparisons.service';
import { ProcurementQuotesController } from './procurement-quotes/procurement-quotes.controller';
import { ProcurementQuotesService } from './procurement-quotes/procurement-quotes.service';
import { ProcurementRequestsController } from './procurement-requests/procurement-requests.controller';
import { ProcurementRequestsService } from './procurement-requests/procurement-requests.service';

@Module({
  controllers: [
    ProcurementRequestsController,
    ProcurementQuotesController,
    ProcurementComparisonsController,
    ProcurementApprovalsController,
  ],
  providers: [
    ProcurementRequestsService,
    ProcurementQuotesService,
    ProcurementComparisonsService,
    ProcurementApprovalsService,
  ],
  exports: [
    ProcurementRequestsService,
    ProcurementQuotesService,
    ProcurementComparisonsService,
    ProcurementApprovalsService,
  ],
})
export class ProcurementModule {}
