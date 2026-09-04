import { Module } from '@nestjs/common';
import { CitiesController } from './cities/cities.controller';
import { CitiesService } from './cities/cities.service';
import { CountriesController } from './countries/countries.controller';
import { CountriesService } from './countries/countries.service';

/**
 * Global reference data (countries, currencies, taxes, units, terms…).
 */
@Module({
  controllers: [CountriesController, CitiesController],
  providers: [CountriesService, CitiesService],
})
export class SettingsModule {}
