import { PermissionModel, Prisma } from '@prisma/client';
import { Service } from '.';
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
      include: { service: true },
    });

    return permission;
  }

  public static async createPermission(props: {
    permissionId: string;
    serviceId: string;
    name: string;
    description: string;
  }): Promise<PermissionModel> {
    const schema = Joi.object({
      permissionId: Joi.string().uuid().required(),
      serviceId: Joi.string().uuid().required(),
      name: Joi.string().min(2).max(16).required(),
      description: Joi.string().default('').allow('').max(64).optional(),
      index: Joi.number().allow(null).optional(),
    });

    const { permissionId, name, serviceId, description, index } =
      await schema.validateAsync(props);

    await Service.getServiceOrThrow(serviceId);
    const exists = await Permission.getPermission(permissionId);
    if (exists) {
      throw new InternalError(
        '이미 존재하는 권한입니다.',
        OPCODE.ALREADY_EXISTS
      );
    }

    const permission = await prisma.permissionModel.create({
      data: { permissionId, name, description, index, serviceId },
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
        { serviceId: { contains: search } },
        { name: { contains: search } },
      ],
    };

    const include: Prisma.PermissionModelInclude = { service: true };
    const [total, permissions] = await prisma.$transaction([
      prisma.permissionModel.count({ where }),
      prisma.permissionModel.findMany({
        take,
        skip,
        where,
        include,
        orderBy,
      }),
    ]);

    return { total, permissions };
  }

  public static async modifyPermission(
    permission: PermissionModel,
    props: {
      permissionId: string;
      serviceId: string;
      name: string;
      description: string;
      index: number;
    }
  ): Promise<PermissionModel> {
    const schema = Joi.object({
      permissionId: Joi.string().uuid().required(),
      serviceId: Joi.string().uuid().required(),
      name: Joi.string().min(2).max(16).required(),
      description: Joi.string().default('').allow('').max(64).optional(),
      index: Joi.number().allow(null).optional(),
    });

    const { permissionId } = permission;
    const { name, description, index, serviceId } = await schema.validateAsync(
      props
    );

    await Service.getServiceOrThrow(serviceId);
    return prisma.permissionModel.update({
      where: { permissionId },
      data: { serviceId, name, description, index },
      include: { service: true },
    });
  }

  public static async deletePermission(
    permission: PermissionModel
  ): Promise<void> {
    const { permissionId } = permission;
    await prisma.permissionModel.delete({ where: { permissionId } });
  }
}
