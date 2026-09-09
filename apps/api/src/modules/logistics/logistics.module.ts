import { Module } from '@nestjs/common';
import { CarriersController } from './carriers/carriers.controller';
import { CarriersService } from './carriers/carriers.service';
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
  ],
  providers: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
    ShipmentsService,
  ],
  exports: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
    ShipmentsService,
  ],
})
export class LogisticsModule {}
