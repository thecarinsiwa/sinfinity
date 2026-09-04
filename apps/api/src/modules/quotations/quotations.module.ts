import { Module } from '@nestjs/common';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { QuotationStatusesController } from './quotation-statuses/quotation-statuses.controller';
import { QuotationStatusesSeedService } from './quotation-statuses/quotation-statuses-seed.service';
import { QuotationStatusesService } from './quotation-statuses/quotation-statuses.service';
import { QuotationsController } from './quotations/quotations.controller';
import { QuotationsService } from './quotations/quotations.service';

@Module({
  imports: [SalesOrdersModule],
  controllers: [QuotationStatusesController, QuotationsController],
  providers: [
    QuotationStatusesSeedService,
    QuotationStatusesService,
    QuotationsService,
  ],
  exports: [
    QuotationStatusesSeedService,
    QuotationStatusesService,
    QuotationsService,
  ],
})
export class QuotationsModule {}
