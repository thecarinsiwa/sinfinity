import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AncillaryFeesController } from './fee-components/ancillary-fees.controller';
import { AncillaryFeesService } from './fee-components/ancillary-fees.service';
import { LandedCostsController } from './landed-costs/landed-costs.controller';
import { LandedCostsService } from './landed-costs/landed-costs.service';

/**
 * Phase 12 — Coût rendu (landed costs): header, items, fees, calculate/post.
 */
@Module({
  imports: [SettingsModule],
  controllers: [LandedCostsController, AncillaryFeesController],
  providers: [LandedCostsService, AncillaryFeesService],
  exports: [LandedCostsService, AncillaryFeesService],
})
export class LandedCostsModule {}
