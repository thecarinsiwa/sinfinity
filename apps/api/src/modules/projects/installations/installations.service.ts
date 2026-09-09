import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  installation_items,
  installation_tasks,
  installations,
  products,
  projects,
  serial_numbers,
  technicians,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime, toBool } from '../../settings/utils/mysql-datetime';
import {
  assertSerialNumberTransition,
  SERIAL_NUMBER_STATUS,
  type SerialNumberStatus,
} from '../../stock/serials/serial-number-statuses';
import { assertOrgAccess } from '../projects-scope';
import {
  assertInstallationTransition,
  INSTALLATION_STATUS,
  type InstallationStatus,
} from '../installation-statuses';
import {
  INSTALLATION_TASK_STATUS,
  type InstallationTaskStatus,
} from '../installation-task-statuses';
import {
  CreateInstallationDto,
  CreateInstallationItemDto,
  CreateInstallationTaskDto,
  InstallationItemResponseDto,
  InstallationResponseDto,
  InstallationTaskResponseDto,
  TransitionInstallationDto,
  UpdateInstallationDto,
  UpdateInstallationItemDto,
  UpdateInstallationTaskDto,
} from './dto/installation.dto';
import {
  toInstallationItemResponse,
  toInstallationResponse,
  toInstallationTaskResponse,
  type InstallationItemRow,
  type InstallationRow,
  type InstallationTaskRow,
} from './installations.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class InstallationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listByProject(
    projectId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationResponseDto[]> {
    await this.requireProjectAccess(projectId, currentOrganizationId, user);
    const rows = await this.db
      .select()
      .from(installations)
      .where(eq(installations.project_id, projectId))
      .orderBy(asc(installations.created_at), asc(installations.id));
    return (rows as InstallationRow[]).map((row) =>
      toInstallationResponse(row),
    );
  }

  async findOne(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    const row = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    const [items, tasks] = await Promise.all([
      this.loadItems(installationId),
      this.loadTasks(installationId),
    ]);
    return toInstallationResponse(row, items, tasks);
  }

  async create(
    projectId: string,
    dto: CreateInstallationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );
    if (dto.leadTechnicianId) {
      await this.ensureTechnicianInOrg(
        dto.leadTechnicianId,
        project.organization_id,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(installations).values({
        id,
        project_id: projectId,
        name: dto.name.trim(),
        site_location: dto.siteLocation ?? null,
        scheduled_at: toMysqlDateTime(dto.scheduledAt),
        completed_at: null,
        status: INSTALLATION_STATUS.PLANNED,
        lead_technician_id: dto.leadTechnicianId ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation reference');
    }

    return this.findOne(projectId, id, currentOrganizationId, user);
  }

  async update(
    projectId: string,
    installationId: string,
    dto: UpdateInstallationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    const existing = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);

    if (dto.leadTechnicianId) {
      const project = await this.requireProjectAccess(
        projectId,
        currentOrganizationId,
        user,
      );
      await this.ensureTechnicianInOrg(
        dto.leadTechnicianId,
        project.organization_id,
      );
    }

    const patch: Partial<{
      name: string;
      site_location: string | null;
      scheduled_at: string | null;
      lead_technician_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.siteLocation !== undefined) {
      patch.site_location = dto.siteLocation;
    }
    if (dto.scheduledAt !== undefined) {
      patch.scheduled_at = toMysqlDateTime(dto.scheduledAt);
    }
    if (dto.leadTechnicianId !== undefined) {
      patch.lead_technician_id = dto.leadTechnicianId;
    }

    try {
      await this.db
        .update(installations)
        .set(patch)
        .where(eq(installations.id, installationId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation reference');
    }

    return this.findOne(projectId, installationId, currentOrganizationId, user);
  }

  async remove(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== INSTALLATION_STATUS.PLANNED &&
      existing.status !== INSTALLATION_STATUS.FAILED
    ) {
      throw new BadRequestException(
        'Only a planned or failed installation can be deleted',
      );
    }
    await this.db
      .delete(installations)
      .where(eq(installations.id, installationId));
  }

  async transition(
    projectId: string,
    installationId: string,
    dto: TransitionInstallationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    const existing = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    try {
      assertInstallationTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const now = nowMysqlDateTime();
    const patch: Partial<{
      status: InstallationStatus;
      completed_at: string | null;
      updated_at: string;
    }> = {
      status: dto.toStatus,
      updated_at: now,
    };
    if (dto.toStatus === INSTALLATION_STATUS.COMPLETED) {
      patch.completed_at = now;
    }

    await this.db
      .update(installations)
      .set(patch)
      .where(eq(installations.id, installationId));

    return this.findOne(projectId, installationId, currentOrganizationId, user);
  }

  async listItems(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationItemResponseDto[]> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(installationId);
    return items.map(toInstallationItemResponse);
  }

  async createItem(
    projectId: string,
    installationId: string,
    dto: CreateInstallationItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationItemResponseDto> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(installation.status);
    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );

    const quantity = dto.quantity ?? '1.0000';
    const product = await this.ensureProductInOrg(
      dto.productId,
      project.organization_id,
    );
    await this.assertProductSerialRules({
      organizationId: project.organization_id,
      productId: dto.productId,
      isSerialized: toBool(product.is_serialized),
      serialNumberId: dto.serialNumberId ?? null,
      quantity,
      requireShipped: true,
    });

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(installation_items).values({
        id,
        installation_id: installationId,
        product_id: dto.productId,
        serial_number_id: dto.serialNumberId ?? null,
        quantity,
        installed_at: null,
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation item reference');
    }

    return this.requireItem(installationId, id);
  }

  async updateItem(
    projectId: string,
    installationId: string,
    itemId: string,
    dto: UpdateInstallationItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationItemResponseDto> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(installation.status);
    const existing = await this.requireItemRow(installationId, itemId);
    if (existing.installed_at) {
      throw new BadRequestException(
        'Cannot update a validated installation item',
      );
    }

    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );
    const productId = dto.productId ?? existing.product_id;
    if (!productId) {
      throw new BadRequestException('productId is required');
    }
    const product = await this.ensureProductInOrg(
      productId,
      project.organization_id,
    );
    const quantity = dto.quantity ?? existing.quantity;
    const serialNumberId =
      dto.serialNumberId !== undefined
        ? dto.serialNumberId
        : existing.serial_number_id;

    await this.assertProductSerialRules({
      organizationId: project.organization_id,
      productId,
      isSerialized: toBool(product.is_serialized),
      serialNumberId,
      quantity,
      requireShipped: true,
    });

    const patch: Partial<{
      product_id: string;
      serial_number_id: string | null;
      quantity: string;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serialNumberId !== undefined) {
      patch.serial_number_id = dto.serialNumberId;
    }
    if (dto.quantity !== undefined) patch.quantity = dto.quantity;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(installation_items)
        .set(patch)
        .where(eq(installation_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation item reference');
    }

    return this.requireItem(installationId, itemId);
  }

  async removeItem(
    projectId: string,
    installationId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(installation.status);
    const existing = await this.requireItemRow(installationId, itemId);
    if (existing.installed_at) {
      throw new BadRequestException(
        'Cannot remove a validated installation item',
      );
    }
    await this.db
      .delete(installation_items)
      .where(eq(installation_items.id, itemId));
  }

  async validateItem(
    projectId: string,
    installationId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationItemResponseDto> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    if (
      installation.status === INSTALLATION_STATUS.COMPLETED ||
      installation.status === INSTALLATION_STATUS.FAILED
    ) {
      throw new BadRequestException(
        `Cannot validate items on an installation in status "${installation.status}"`,
      );
    }

    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );

    await this.db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(installation_items)
        .where(
          and(
            eq(installation_items.id, itemId),
            eq(installation_items.installation_id, installationId),
          ),
        )
        .limit(1);
      if (!item) {
        throw new NotFoundException(
          `Installation item ${itemId} not found on installation ${installationId}`,
        );
      }
      if (item.installed_at) {
        throw new BadRequestException('Installation item is already validated');
      }
      if (!item.product_id) {
        throw new BadRequestException('Installation item has no product');
      }

      const product = await this.ensureProductInOrg(
        item.product_id,
        project.organization_id,
        tx,
      );
      const isSerialized = toBool(product.is_serialized);

      if (isSerialized) {
        if (!item.serial_number_id) {
          throw new BadRequestException(
            'Serialized product requires serialNumberId to validate',
          );
        }
        const serial = await this.requireSerialForProduct({
          serialNumberId: item.serial_number_id,
          organizationId: project.organization_id,
          productId: item.product_id,
          requireShipped: true,
          db: tx,
        });
        try {
          assertSerialNumberTransition(
            serial.status as SerialNumberStatus,
            SERIAL_NUMBER_STATUS.INSTALLED,
          );
        } catch (error) {
          throw new BadRequestException(
            error instanceof Error
              ? error.message
              : 'Invalid serial status transition',
          );
        }
        const now = nowMysqlDateTime();
        await tx
          .update(serial_numbers)
          .set({
            status: SERIAL_NUMBER_STATUS.INSTALLED,
            updated_at: now,
          })
          .where(eq(serial_numbers.id, item.serial_number_id));
        await tx
          .update(installation_items)
          .set({
            installed_at: now,
            updated_at: now,
          })
          .where(eq(installation_items.id, itemId));
      } else {
        const now = nowMysqlDateTime();
        await tx
          .update(installation_items)
          .set({
            installed_at: now,
            updated_at: now,
          })
          .where(eq(installation_items.id, itemId));
      }
    });

    return this.requireItem(installationId, itemId);
  }

  async listTasks(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationTaskResponseDto[]> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    const tasks = await this.loadTasks(installationId);
    return tasks.map(toInstallationTaskResponse);
  }

  async createTask(
    projectId: string,
    installationId: string,
    dto: CreateInstallationTaskDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationTaskResponseDto> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(installation.status);
    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );
    if (dto.technicianId) {
      await this.ensureTechnicianInOrg(
        dto.technicianId,
        project.organization_id,
      );
    }

    const status = dto.status ?? INSTALLATION_TASK_STATUS.TODO;
    const now = nowMysqlDateTime();
    const id = createId();
    try {
      await this.db.insert(installation_tasks).values({
        id,
        installation_id: installationId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        technician_id: dto.technicianId ?? null,
        status,
        due_at: toMysqlDateTime(dto.dueAt),
        completed_at: status === INSTALLATION_TASK_STATUS.DONE ? now : null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation task reference');
    }

    return this.requireTask(installationId, id);
  }

  async updateTask(
    projectId: string,
    installationId: string,
    taskId: string,
    dto: UpdateInstallationTaskDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationTaskResponseDto> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(installation.status);
    await this.requireTaskRow(installationId, taskId);

    if (dto.technicianId) {
      const project = await this.requireProjectAccess(
        projectId,
        currentOrganizationId,
        user,
      );
      await this.ensureTechnicianInOrg(
        dto.technicianId,
        project.organization_id,
      );
    }

    const now = nowMysqlDateTime();
    const patch: Partial<{
      title: string;
      description: string | null;
      technician_id: string | null;
      status: InstallationTaskStatus;
      due_at: string | null;
      completed_at: string | null;
      updated_at: string;
    }> = { updated_at: now };

    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.technicianId !== undefined) {
      patch.technician_id = dto.technicianId;
    }
    if (dto.dueAt !== undefined) patch.due_at = toMysqlDateTime(dto.dueAt);
    if (dto.status !== undefined) {
      patch.status = dto.status;
      patch.completed_at =
        dto.status === INSTALLATION_TASK_STATUS.DONE ? now : null;
    }

    try {
      await this.db
        .update(installation_tasks)
        .set(patch)
        .where(eq(installation_tasks.id, taskId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation task reference');
    }

    return this.requireTask(installationId, taskId);
  }

  async removeTask(
    projectId: string,
    installationId: string,
    taskId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const installation = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(installation.status);
    await this.requireTaskRow(installationId, taskId);
    await this.db
      .delete(installation_tasks)
      .where(eq(installation_tasks.id, taskId));
  }

  private assertMutable(status: InstallationStatus): void {
    if (
      status === INSTALLATION_STATUS.COMPLETED ||
      status === INSTALLATION_STATUS.FAILED
    ) {
      throw new BadRequestException(
        `Cannot modify an installation in status "${status}"`,
      );
    }
  }

  private async loadItems(
    installationId: string,
  ): Promise<InstallationItemRow[]> {
    const rows = await this.db
      .select()
      .from(installation_items)
      .where(eq(installation_items.installation_id, installationId))
      .orderBy(asc(installation_items.created_at), asc(installation_items.id));
    return rows;
  }

  private async loadTasks(
    installationId: string,
  ): Promise<InstallationTaskRow[]> {
    const rows = await this.db
      .select()
      .from(installation_tasks)
      .where(eq(installation_tasks.installation_id, installationId))
      .orderBy(asc(installation_tasks.created_at), asc(installation_tasks.id));
    return rows;
  }

  private async requireItem(
    installationId: string,
    itemId: string,
  ): Promise<InstallationItemResponseDto> {
    const row = await this.requireItemRow(installationId, itemId);
    return toInstallationItemResponse(row);
  }

  private async requireItemRow(
    installationId: string,
    itemId: string,
  ): Promise<InstallationItemRow> {
    const [row] = await this.db
      .select()
      .from(installation_items)
      .where(
        and(
          eq(installation_items.id, itemId),
          eq(installation_items.installation_id, installationId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Installation item ${itemId} not found on installation ${installationId}`,
      );
    }
    return row;
  }

  private async requireTask(
    installationId: string,
    taskId: string,
  ): Promise<InstallationTaskResponseDto> {
    const row = await this.requireTaskRow(installationId, taskId);
    return toInstallationTaskResponse(row);
  }

  private async requireTaskRow(
    installationId: string,
    taskId: string,
  ): Promise<InstallationTaskRow> {
    const [row] = await this.db
      .select()
      .from(installation_tasks)
      .where(
        and(
          eq(installation_tasks.id, taskId),
          eq(installation_tasks.installation_id, installationId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Installation task ${taskId} not found on installation ${installationId}`,
      );
    }
    return row;
  }

  private async requireProjectAccess(
    projectId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: projects.id,
        organization_id: projects.organization_id,
      })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'project',
    );
    return row;
  }

  private async requireInstallationAccess(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationRow> {
    await this.requireProjectAccess(projectId, currentOrganizationId, user);
    const [row] = await this.db
      .select()
      .from(installations)
      .where(
        and(
          eq(installations.id, installationId),
          eq(installations.project_id, projectId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Installation ${installationId} not found on project ${projectId}`,
      );
    }
    return row;
  }

  private async ensureTechnicianInOrg(
    technicianId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: technicians.id,
        organization_id: technicians.organization_id,
      })
      .from(technicians)
      .where(
        and(eq(technicians.id, technicianId), isNull(technicians.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Technician ${technicianId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Technician must belong to the same organization',
      );
    }
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<{ id: string; is_serialized: number }> {
    const [row] = await db
      .select({
        id: products.id,
        organization_id: products.organization_id,
        is_serialized: products.is_serialized,
      })
      .from(products)
      .where(and(eq(products.id, productId), isNull(products.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Product must belong to the same organization',
      );
    }
    return row;
  }

  private async assertProductSerialRules(params: {
    organizationId: string;
    productId: string;
    isSerialized: boolean;
    serialNumberId: string | null;
    quantity: string;
    requireShipped: boolean;
  }): Promise<void> {
    if (params.isSerialized) {
      if (!params.serialNumberId) {
        throw new BadRequestException(
          'Serialized product requires serialNumberId',
        );
      }
      const qty = Number(params.quantity);
      if (!Number.isFinite(qty) || Math.abs(qty - 1) > 1e-9) {
        throw new BadRequestException('Serialized product quantity must be 1');
      }
      await this.requireSerialForProduct({
        serialNumberId: params.serialNumberId,
        organizationId: params.organizationId,
        productId: params.productId,
        requireShipped: params.requireShipped,
      });
    } else if (params.serialNumberId) {
      throw new BadRequestException(
        'serialNumberId is only allowed for serialized products',
      );
    }
  }

  private async requireSerialForProduct(params: {
    serialNumberId: string;
    organizationId: string;
    productId: string;
    requireShipped: boolean;
    db?: DrizzleDB | Tx;
  }): Promise<{
    id: string;
    status: string;
    product_id: string;
    organization_id: string;
  }> {
    const db = params.db ?? this.db;
    const [row] = await db
      .select({
        id: serial_numbers.id,
        status: serial_numbers.status,
        product_id: serial_numbers.product_id,
        organization_id: serial_numbers.organization_id,
      })
      .from(serial_numbers)
      .where(eq(serial_numbers.id, params.serialNumberId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Serial number ${params.serialNumberId} not found`,
      );
    }
    if (row.organization_id !== params.organizationId) {
      throw new BadRequestException(
        'Serial number must belong to the same organization',
      );
    }
    if (row.product_id !== params.productId) {
      throw new BadRequestException(
        'Serial number product must match the installation item product',
      );
    }
    if (params.requireShipped && row.status !== SERIAL_NUMBER_STATUS.SHIPPED) {
      throw new BadRequestException(
        `Serial number must be "${SERIAL_NUMBER_STATUS.SHIPPED}" (got "${row.status}")`,
      );
    }
    return row;
  }
}
