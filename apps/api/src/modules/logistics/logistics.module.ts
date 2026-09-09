import { Module } from '@nestjs/common';
import { CarriersController } from './carriers/carriers.controller';
import { CarriersService } from './carriers/carriers.service';
import { CustomsDeclarationsController } from './customs/customs-declarations.controller';
import { CustomsDeclarationsService } from './customs/customs-declarations.service';
import { ImportDocumentsController } from './customs/import-documents.controller';
import { ImportDocumentsService } from './customs/import-documents.service';
import { ShipmentsController } from './shipments/shipments.controller';
import { ShipmentsService } from './shipments/shipments.service';
import { ShippingMethodsController } from './shipping-methods/shipping-methods.controller';
import { ShippingMethodsSeedService } from './shipping-methods/shipping-methods-seed.service';
import { ShippingMethodsService } from './shipping-methods/shipping-methods.service';

@Module({
  controllers: [
    ShippingMethodsController,
    CarriersController,
    ShipmentsController,
    CustomsDeclarationsController,
    ImportDocumentsController,
  ],
  providers: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
    ShipmentsService,
    CustomsDeclarationsService,
    ImportDocumentsService,
  ],
  exports: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
    ShipmentsService,
    CustomsDeclarationsService,
    ImportDocumentsService,
  ],
})
export class LogisticsModule {}
