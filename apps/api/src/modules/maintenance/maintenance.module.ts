import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { MaintenanceContractsController } from './contracts/maintenance-contracts.controller';
import { MaintenanceContractsService } from './contracts/maintenance-contracts.service';
import { MaintenanceInterventionsController } from './interventions/maintenance-interventions.controller';
import { MaintenanceInterventionsService } from './interventions/maintenance-interventions.service';
import { ServiceRequestsController } from './tickets/service-requests.controller';
import { ServiceRequestsService } from './tickets/service-requests.service';
import { SupportTicketsController } from './tickets/support-tickets.controller';
import { SupportTicketsService } from './tickets/support-tickets.service';

/**
 * Phase 16 — Maintenance (tickets, contracts, interventions; warranties next).
 */
@Module({
  imports: [StockModule],
  controllers: [
    SupportTicketsController,
    ServiceRequestsController,
    MaintenanceContractsController,
    MaintenanceInterventionsController,
  ],
  providers: [
    SupportTicketsService,
    ServiceRequestsService,
    MaintenanceContractsService,
    MaintenanceInterventionsService,
  ],
  exports: [
    SupportTicketsService,
    ServiceRequestsService,
    MaintenanceContractsService,
    MaintenanceInterventionsService,
  ],
})
export class MaintenanceModule {}
