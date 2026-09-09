import { ListSalesActivitiesQueryDto } from '../../crm/sales-activities/dto/list-sales-activities-query.dto';
import { SalesActivitiesService } from '../../crm/sales-activities/sales-activities.service';
import { ACTIVITIES_FUSION_NOTE } from './ACTIVITIES_FUSION';
import { ActivitiesAliasController } from './activities-alias.controller';

describe('ActivitiesAliasController', () => {
  it('documents fusion note', () => {
    expect(ACTIVITIES_FUSION_NOTE).toContain('sales_activities');
  });

  it('delegates findAll to SalesActivitiesService', async () => {
    const findAll = jest.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    const controller = new ActivitiesAliasController({
      findAll,
    } as unknown as SalesActivitiesService);

    const query = { page: 1, pageSize: 20 } as ListSalesActivitiesQueryDto;
    const orgId = 'org-1';
    const user = { id: 'u1', organizationId: orgId } as never;

    await controller.findAll(query, orgId, user);

    expect(findAll).toHaveBeenCalledWith(query, orgId, user);
  });
});
