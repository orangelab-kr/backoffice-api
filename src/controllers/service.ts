import {
  Prisma,
  ServiceModel,
  UserModel,
  PermissionModel,
} from '@prisma/client';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { InternalError, OPCODE, prisma } from '..';

export class Service {
  private static readonly select: Prisma.ServiceModelSelect = {
    serviceId: true,
    endpoint: true,
    secretKey: false,
    permissions: false,
    createdAt: true,
    updatedAt: true,
  };

  public static async getServices(props: {
    take?: number;
    skip?: number;
    search?: string;
    orderByField?: string;
    orderBySort?: string;
  }): Promise<{ total: number; services: ServiceModel[] }> {
    const { take, skip, search, orderByField, orderBySort } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      orderByField: Joi.string()
        .optional()
        .valid('createdAt')
        .default('createdAt'),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    }).validateAsync(props);

    const { select } = Service;
    const orderBy = { [orderByField]: orderBySort };
    const where: Prisma.ServiceModelWhereInput = {};
    if (search) where.serviceId = { contains: search };
    const [total, services] = <any>await prisma.$transaction([
      prisma.serviceModel.count({ where }),
      prisma.serviceModel.findMany({
        take,
        skip,
        where,
        select,
        orderBy,
      }),
    ]);

    return { total, services };
  }

  public static async generateAccessToken(props: {
    user: UserModel;
    service: ServiceModel;
  }): Promise<string> {
    const { user, service } = props;
    const { userId, email: aud } = user;
    const { serviceId, secretKey } = service;
    const permissions = await prisma.userModel
      .findFirst({ where: { userId } })
      .permissionGroup()
      .permissions({ where: { serviceId, index: { not: null } } });

    const sub = serviceId;
    const options = { expiresIn: '1h' };
    const iss = process.env.SERVICE_ISSUER;
    const prs = Service.getEncodedPermission(<any>permissions);
    return jwt.sign({ sub, iss, aud, prs }, secretKey, options);
  }

  private static getEncodedPermission(
    permissions: PermissionModel & { index: number }[]
  ): string {
    const bitmask = '0'.repeat(128).split('');
    permissions.forEach(({ index }) => (bitmask[index] = '1'));
    return parseInt(bitmask.reverse().join(''), 2).toString(36);
  }

  public static async getService(
    serviceId: string,
    withSecretKey = false
  ): Promise<ServiceModel | null> {
    const { select } = Service;
    if (withSecretKey) select.secretKey = true;
    return <any>prisma.serviceModel.findFirst({ where: { serviceId }, select });
  }

  public static async getServiceOrThrow(
    serviceId: string,
    withSecretKey = false
  ): Promise<ServiceModel> {
    const service = await Service.getService(serviceId, withSecretKey);
    if (!service) {
      throw new InternalError('서비스를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    return service;
  }

  public static async createService(props: {
    serviceId: string;
    endpoint: string;
    secretKey: string;
  }): Promise<ServiceModel> {
    const { select } = Service;
    const { serviceId, endpoint, secretKey } = await Joi.object({
      serviceId: Joi.string().required(),
      endpoint: Joi.string().uri().required(),
      secretKey: Joi.string().required(),
    }).validateAsync(props);
    const exists = await Service.getService(serviceId);
    if (exists) {
      throw new InternalError(
        '이미 동일한 이름의 서비스가 존재합니다.',
        OPCODE.ALREADY_EXISTS
      );
    }

    return <any>prisma.serviceModel.create({
      data: { serviceId, endpoint, secretKey },
      select,
    });
  }

  public static async modifyService(
    service: ServiceModel,
    props: {
      serviceId: string;
      endpoint: string;
      secretKey: string;
    }
  ): Promise<ServiceModel> {
    const { serviceId, endpoint, secretKey } = await Joi.object({
      serviceId: Joi.string().optional(),
      endpoint: Joi.string().uri().optional(),
      secretKey: Joi.string().optional(),
    }).validateAsync(props);
    if (serviceId !== service.serviceId) {
      const exists = await Service.getService(serviceId);
      if (exists) {
        throw new InternalError(
          '이미 동일한 이름의 서비스가 존재합니다.',
          OPCODE.ALREADY_EXISTS
        );
      }
    }

    const { select } = Service;
    const where = { serviceId: service.serviceId };
    const data = { serviceId, endpoint, secretKey };
    return <any>prisma.serviceModel.update({ where, data, select });
  }

  public static async deleteService(service: ServiceModel): Promise<void> {
    const { serviceId } = service;
    await prisma.permissionModel.deleteMany({ where: { serviceId } });
    await prisma.serviceModel.delete({ where: { serviceId } });
  }
}
