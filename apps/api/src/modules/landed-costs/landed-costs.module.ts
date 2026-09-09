import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';

/**
 * Phase 12 — Coût rendu (landed costs).
 * Controllers/services for header, fee components and calculate/post engine
 * are added in subsequent branches.
 */
@Module({
  imports: [SettingsModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class LandedCostsModule {}
