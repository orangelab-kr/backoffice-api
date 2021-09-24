import { PermissionModel, Prisma } from '@prisma/client';
import { InternalError, Joi, OPCODE, prisma } from '..';

export class Permission {
  public static async getPermissionOrThrow(
    permissionId: string
  ): Promise<PermissionModel> {
    const permission = await Permission.getPermission(permissionId);
    if (!permission) {
      throw new InternalError(
        `해당 권한을 찾을 수 없습니다.`,
        OPCODE.NOT_FOUND
      );
    }

    return permission;
  }

  public static async getPermission(
    permissionId: string
  ): Promise<PermissionModel | null> {
    const permission = await prisma.permissionModel.findFirst({
      where: { permissionId },
    });

    return permission;
  }

  public static async createPermission(props: {
    permissionId: string;
    name: string;
    description: string;
  }): Promise<PermissionModel> {
    const schema = Joi.object({
      permissionId: Joi.string().uuid().required(),
      name: Joi.string().min(2).max(16).required(),
      description: Joi.string().default('').allow('').max(64).optional(),
    });

    const { permissionId, name, description } = await schema.validateAsync(
      props
    );

    const exists = await Permission.getPermission(permissionId);
    if (exists) {
      throw new InternalError(
        '이미 존재하는 권한입니다.',
        OPCODE.ALREADY_EXISTS
      );
    }

    const permission = await prisma.permissionModel.create({
      data: { permissionId, name, description },
    });

    return permission;
  }

  public static async getPermissions(props: {
    take?: number;
    skip?: number;
    search?: string;
    orderByField?: string;
    orderBySort?: string;
  }): Promise<{ total: number; permissions: PermissionModel[] }> {
    const schema = Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      orderByField: Joi.string()
        .optional()
        .valid('permissionId', 'name', 'createdAt')
        .default('permissionId')
        .default('name'),
      orderBySort: Joi.string().valid('asc', 'desc').default('asc').optional(),
    });

    const { take, skip, search, orderByField, orderBySort } =
      await schema.validateAsync(props);
    const orderBy = { [orderByField]: orderBySort };
    const where: Prisma.PermissionModelWhereInput = {
      OR: [
        { permissionId: { contains: search } },
        { name: { contains: search } },
      ],
    };

    const [total, permissions] = await prisma.$transaction([
      prisma.permissionModel.count({ where }),
      prisma.permissionModel.findMany({
        take,
        skip,
        where,
        orderBy,
      }),
    ]);

    return { total, permissions };
  }

  public static async modifyPermission(
    permissionId: string,
    props: { name: string; description: string }
  ): Promise<void> {
    const schema = Joi.object({
      name: Joi.string().min(2).max(16).required(),
      description: Joi.string().default('').allow('').max(64).optional(),
    });

    const { name, description } = await schema.validateAsync(props);
    await prisma.permissionModel.update({
      where: { permissionId },
      data: { name, description },
    });
  }

  public static async deletePermission(permissionId: string): Promise<void> {
    await prisma.permissionModel.delete({ where: { permissionId } });
  }
}
