import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { LandedCostsController } from './landed-costs/landed-costs.controller';
import { LandedCostsService } from './landed-costs/landed-costs.service';

/**
 * Phase 12 — Coût rendu (landed costs).
 * Fee components and calculate/post engine are added in subsequent branches.
 */
@Module({
  imports: [SettingsModule],
  controllers: [LandedCostsController],
  providers: [LandedCostsService],
  exports: [LandedCostsService],
})
export class LandedCostsModule {}
