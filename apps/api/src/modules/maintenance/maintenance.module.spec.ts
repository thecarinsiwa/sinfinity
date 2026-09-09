import { MODULE_METADATA } from '@nestjs/common/constants';
import { AppModule } from '../../app.module';
import { StockModule } from '../stock/stock.module';
import { MaintenanceModule } from './maintenance.module';

describe('MaintenanceModule wiring', () => {
  it('imports StockModule for serial validation', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      MaintenanceModule,
    ) as unknown[];
    expect(imports).toContain(StockModule);
  });

  it('is registered in AppModule', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AppModule,
    ) as unknown[];
    expect(imports).toContain(MaintenanceModule);
  });
});
