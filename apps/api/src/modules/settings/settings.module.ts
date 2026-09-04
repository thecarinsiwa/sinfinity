import { Module } from '@nestjs/common';
import { CitiesController } from './cities/cities.controller';
import { CitiesService } from './cities/cities.service';
import { CountriesController } from './countries/countries.controller';
import { CountriesService } from './countries/countries.service';
import { CurrenciesController } from './currencies/currencies.controller';
import { CurrenciesService } from './currencies/currencies.service';
import { ExchangeRatesController } from './exchange-rates/exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates/exchange-rates.service';
import { PaymentTermsController } from './payment-terms/payment-terms.controller';
import { PaymentTermsService } from './payment-terms/payment-terms.service';
import { ShippingTermsController } from './shipping-terms/shipping-terms.controller';
import { ShippingTermsService } from './shipping-terms/shipping-terms.service';
import { TaxesController } from './taxes/taxes.controller';
import { TaxesService } from './taxes/taxes.service';
import { UnitsController } from './units/units.controller';
import { UnitsService } from './units/units.service';

/**
 * Global reference data (countries, currencies, taxes, units, terms…).
 */
@Module({
  controllers: [
    CountriesController,
    CitiesController,
    CurrenciesController,
    ExchangeRatesController,
    TaxesController,
    UnitsController,
    PaymentTermsController,
    ShippingTermsController,
  ],
  providers: [
    CountriesService,
    CitiesService,
    CurrenciesService,
    ExchangeRatesService,
    TaxesService,
    UnitsService,
    PaymentTermsService,
    ShippingTermsService,
  ],
})
export class SettingsModule {}
