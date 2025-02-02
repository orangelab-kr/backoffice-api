import { InternalError, Joi, OPCODE, prisma } from '..';
import { PermissionGroupModel, Prisma } from '@prisma/client';

export class PermissionGroup {
  public static async getPermissionGroupOrThrow(
    permissionGroupId: string
  ): Promise<PermissionGroupModel> {
    const permissionGroup = await PermissionGroup.getPermissionGroup(
      permissionGroupId
    );

    if (!permissionGroup) {
      throw new InternalError(
        '해당 권한 그룹을 찾을 수 없습니다.',
        OPCODE.NOT_FOUND
      );
    }

    return permissionGroup;
  }

  public static async getPermissionGroup(
    permissionGroupId: string
  ): Promise<PermissionGroupModel | null> {
    const { findFirst } = prisma.permissionGroupModel;
    const permissionGroup = await findFirst({
      where: { permissionGroupId },
      include: { permissions: true },
    });

    return permissionGroup;
  }

  public static async getPermissionGroups(props: {
    take?: number;
    skip?: number;
    search?: string;
    orderByField?: string;
    orderBySort?: string;
  }): Promise<{ total: number; permissionGroups: PermissionGroupModel[] }> {
    const schema = Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      orderByField: Joi.string()
        .optional()
        .default('name')
        .valid('permissionGroupId', 'name', 'createdAt'),
      orderBySort: Joi.string().valid('asc', 'desc').default('asc').optional(),
    });

    const { take, skip, search, orderByField, orderBySort } =
      await schema.validateAsync(props);
    const orderBy = { [orderByField]: orderBySort };
    const include = { permissions: true };
    const where = { name: { contains: search } };
    const [total, permissionGroups] = await prisma.$transaction([
      prisma.permissionGroupModel.count({ where }),
      prisma.permissionGroupModel.findMany({
        take,
        skip,
        where,
        orderBy,
        include,
      }),
    ]);

    return { total, permissionGroups };
  }

  public static async createPermissionGroup(props: {
    name: string;
    permissions: string[];
  }): Promise<PermissionGroupModel> {
    const schema = Joi.object({
      name: Joi.string().min(2).max(16).required(),
      description: Joi.string().default('').allow('').max(64).optional(),
      permissionIds: Joi.array().items(Joi.string()).required(),
    });

    const { name, description, permissionIds } = await schema.validateAsync(
      props
    );

    const data: Prisma.PermissionGroupModelCreateInput = {
      name,
      description,
      permissions: {
        connect: permissionIds.map((permissionId: string) => ({
          permissionId,
        })),
      },
    };

    const permissionGroup = await prisma.permissionGroupModel.create({
      data,
    });

    return permissionGroup;
  }

  public static async modifyPermissionGroup(
    permissionGroup: PermissionGroupModel,
    props: { name: string; description: string; permissionIds: string[] }
  ): Promise<PermissionGroupModel> {
    const { permissionGroupId } = permissionGroup;
    const schema = Joi.object({
      name: Joi.string().min(2).max(16).optional(),
      description: Joi.string().default('').allow('').max(64).optional(),
      permissionIds: Joi.array().items(Joi.string()).optional(),
    });

    const { name, description, permissionIds } = await schema.validateAsync(
      props
    );

    const where = { permissionGroupId };
    const data: Prisma.PermissionGroupModelUpdateInput = { name, description };
    if (permissionIds) {
      data.permissions = {
        set: permissionIds.map((permissionId: string) => ({ permissionId })),
      };
    }

    return prisma.permissionGroupModel.update({ where, data });
  }

  public static async deletePermissionGroup(
    permissionGroup: PermissionGroupModel
  ): Promise<void> {
    const { permissionGroupId } = permissionGroup;
    const users = await prisma.permissionGroupModel
      .findFirst({ where: { permissionGroupId } })
      .users();

    if (!users || users.length > 0) {
      throw new InternalError(
        `해당 권한 그룹을 사용하는 사용자가 있습니다.`,
        OPCODE.ERROR,
        { users }
      );
    }

    await prisma.permissionGroupModel.deleteMany({
      where: { permissionGroupId },
    });
  }
}
