import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { CrmModule } from './modules/crm/crm.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { LandedCostsModule } from './modules/landed-costs/landed-costs.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { FinancesModule } from './modules/finances/finances.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { SecurityModule } from './modules/security/security.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StockModule } from './modules/stock/stock.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    SettingsModule,
    OrganisationModule,
    SecurityModule,
    DocumentsModule,
    CatalogueModule,
    CrmModule,
    SuppliersModule,
    QuotationsModule,
    SalesOrdersModule,
    ProcurementModule,
    PurchaseOrdersModule,
    LogisticsModule,
    LandedCostsModule,
    StockModule,
    DeliveriesModule,
    ProjectsModule,
    MaintenanceModule,
    FinancesModule,
    CollaborationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
