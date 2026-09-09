import { Module } from '@nestjs/common';
import { CarriersController } from './carriers/carriers.controller';
import { CarriersService } from './carriers/carriers.service';
import { CustomsDeclarationsController } from './customs/customs-declarations.controller';
import { CustomsDeclarationsService } from './customs/customs-declarations.service';
import { ImportDocumentsController } from './customs/import-documents.controller';
import { ImportDocumentsService } from './customs/import-documents.service';
import { DeliveryAddressesController } from './delivery-addresses/delivery-addresses.controller';
import { DeliveryAddressesService } from './delivery-addresses/delivery-addresses.service';
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
    DeliveryAddressesController,
  ],
  providers: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
    ShipmentsService,
    CustomsDeclarationsService,
    ImportDocumentsService,
    DeliveryAddressesService,
  ],
  exports: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
    ShipmentsService,
    CustomsDeclarationsService,
    ImportDocumentsService,
    DeliveryAddressesService,
  ],
})
export class LogisticsModule {}
