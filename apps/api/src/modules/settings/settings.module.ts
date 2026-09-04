import { Module } from '@nestjs/common';
import { CitiesController } from './cities/cities.controller';
import { CitiesService } from './cities/cities.service';
import { CountriesController } from './countries/countries.controller';
import { CountriesService } from './countries/countries.service';
import { CurrenciesController } from './currencies/currencies.controller';
import { CurrenciesService } from './currencies/currencies.service';
import { ExchangeRatesController } from './exchange-rates/exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates/exchange-rates.service';
import { TaxesController } from './taxes/taxes.controller';
import { TaxesService } from './taxes/taxes.service';

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
  ],
  providers: [
    CountriesService,
    CitiesService,
    CurrenciesService,
    ExchangeRatesService,
    TaxesService,
  ],
})
export class SettingsModule {}
