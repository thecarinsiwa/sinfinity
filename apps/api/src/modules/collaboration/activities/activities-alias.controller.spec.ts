import { ListSalesActivitiesQueryDto } from '../../crm/sales-activities/dto/list-sales-activities-query.dto';
import { SalesActivitiesService } from '../../crm/sales-activities/sales-activities.service';
import { ACTIVITIES_FUSION_NOTE } from './ACTIVITIES_FUSION';
import { ActivitiesAliasController } from './activities-alias.controller';

describe('ActivitiesAliasController (alias)', () => {
  it('documents fusion note', () => {
    expect(ACTIVITIES_FUSION_NOTE).toContain('sales_activities');
    expect(ACTIVITIES_FUSION_NOTE).toMatch(/GET \/activities/);
  });

  it('delegates findAll to SalesActivitiesService', async () => {
    const findAll = jest.fn().mockResolvedValue({
      data: [{ id: 'a1' }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const controller = new ActivitiesAliasController({
      findAll,
    } as unknown as SalesActivitiesService);

    const query = {
      page: 1,
      pageSize: 20,
      relatedType: 'lead',
    } as ListSalesActivitiesQueryDto;
    const orgId = 'org-1';
    const user = { id: 'u1', organizationId: orgId } as never;

    const result = await controller.findAll(query, orgId, user);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(findAll).toHaveBeenCalledWith(query, orgId, user);
    expect(result.data).toHaveLength(1);
  });

  it('does not expose write methods on the alias controller', () => {
    const controller = new ActivitiesAliasController({
      findAll: jest.fn(),
    } as unknown as SalesActivitiesService);

    expect(controller).toHaveProperty('findAll');
    expect(controller).not.toHaveProperty('create');
    expect(controller).not.toHaveProperty('update');
    expect(controller).not.toHaveProperty('remove');
  });
});
