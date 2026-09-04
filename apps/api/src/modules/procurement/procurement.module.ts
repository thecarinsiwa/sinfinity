import { Module } from '@nestjs/common';
import { ProcurementRequestsController } from './procurement-requests/procurement-requests.controller';
import { ProcurementRequestsService } from './procurement-requests/procurement-requests.service';

@Module({
  controllers: [ProcurementRequestsController],
  providers: [ProcurementRequestsService],
  exports: [ProcurementRequestsService],
})
export class ProcurementModule {}
