import { MODULE_METADATA } from '@nestjs/common/constants';
import { AppModule } from '../../app.module';
import { StockModule } from '../stock/stock.module';
import { ProjectsModule } from './projects.module';

describe('ProjectsModule wiring', () => {
  it('imports StockModule for serial validation on install', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      ProjectsModule,
    ) as unknown[];
    expect(imports).toContain(StockModule);
  });

  it('is registered in AppModule', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AppModule,
    ) as unknown[];
    expect(imports).toContain(ProjectsModule);
  });
});
