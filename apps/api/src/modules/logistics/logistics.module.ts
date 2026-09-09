import { Module } from '@nestjs/common';
import { CarriersController } from './carriers/carriers.controller';
import { CarriersService } from './carriers/carriers.service';
import { ShippingMethodsController } from './shipping-methods/shipping-methods.controller';
import { ShippingMethodsSeedService } from './shipping-methods/shipping-methods-seed.service';
import { ShippingMethodsService } from './shipping-methods/shipping-methods.service';

@Module({
  controllers: [ShippingMethodsController, CarriersController],
  providers: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
  ],
  exports: [
    ShippingMethodsSeedService,
    ShippingMethodsService,
    CarriersService,
  ],
})
export class LogisticsModule {}
