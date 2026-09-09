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
import { WarrantiesController } from './warranties/warranties.controller';
import { WarrantiesService } from './warranties/warranties.service';

/**
 * Phase 16 — Maintenance et support (tickets, contracts, interventions, warranties).
 */
@Module({
  imports: [StockModule],
  controllers: [
    SupportTicketsController,
    ServiceRequestsController,
    MaintenanceContractsController,
    MaintenanceInterventionsController,
    WarrantiesController,
  ],
  providers: [
    SupportTicketsService,
    ServiceRequestsService,
    MaintenanceContractsService,
    MaintenanceInterventionsService,
    WarrantiesService,
  ],
  exports: [
    SupportTicketsService,
    ServiceRequestsService,
    MaintenanceContractsService,
    MaintenanceInterventionsService,
    WarrantiesService,
  ],
})
export class MaintenanceModule {}
