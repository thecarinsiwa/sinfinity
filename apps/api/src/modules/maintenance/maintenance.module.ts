import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { ServiceRequestsController } from './tickets/service-requests.controller';
import { ServiceRequestsService } from './tickets/service-requests.service';
import { SupportTicketsController } from './tickets/support-tickets.controller';
import { SupportTicketsService } from './tickets/support-tickets.service';

/**
 * Phase 16 — Maintenance (tickets / service requests first; contracts & field next).
 */
@Module({
  imports: [StockModule],
  controllers: [SupportTicketsController, ServiceRequestsController],
  providers: [SupportTicketsService, ServiceRequestsService],
  exports: [SupportTicketsService, ServiceRequestsService],
})
export class MaintenanceModule {}
