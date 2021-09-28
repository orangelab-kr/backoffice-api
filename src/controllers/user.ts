import {
  MethodProvider,
  PermissionGroupModel,
  PermissionModel,
  Prisma,
  UserModel,
} from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { InternalError, Joi, OPCODE, PermissionGroup, prisma } from '..';

export class User {
  public static hasPermissions(
    user: UserModel & {
      permissionGroup: PermissionGroupModel & {
        permissions: PermissionModel[];
      };
    },
    requiredPermissions: string[]
  ): void {
    const permissions = user.permissionGroup.permissions.map(
      ({ permissionId }: { permissionId: string }) => permissionId
    );

    requiredPermissions.forEach((permission: string) => {
      if (!permissions.includes(permission)) {
        throw new InternalError(
          `접근할 권한이 없습니다. (${permission})`,
          OPCODE.ACCESS_DENIED
        );
      }
    });
  }

  public static async createUser(props: {
    username: string;
    email: string;
    phone: string;
    password: string;
    permissionGroup: string;
  }): Promise<UserModel> {
    const schema = Joi.object({
      username: Joi.string().min(2).max(16).required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .regex(/^\+(\d*)$/)
        .messages({
          'string.pattern.base': '+ 로 시작하시는 전화번호를 입력해주세요.',
        }),
      permissionGroupId: Joi.string().uuid().required(),
      password: Joi.string()
        .regex(
          /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{10,}$/
        )
        .messages({
          'string.pattern.base':
            '대소문자와 숫자, 특수문자가 각 1자 이상 포함된 10자 이상의 비밀번호를 입력해주세요.',
        }),
    });

    const { username, email, phone, password, permissionGroupId } =
      await schema.validateAsync(props);
    const isExists = await Promise.all([
      User.isExistsUserEmail(email),
      User.isExistsUserPhone(phone),
    ]);

    if (isExists[0]) {
      throw new InternalError('사용중인 이메일입니다.', OPCODE.ALREADY_EXISTS);
    }

    if (isExists[1]) {
      throw new InternalError(
        '사용중인 전화번호입니다.',
        OPCODE.ALREADY_EXISTS
      );
    }

    await PermissionGroup.getPermissionGroupOrThrow(permissionGroupId);
    const identity = hashSync(password, 10);
    const user = await prisma.userModel.create({
      data: {
        username,
        email,
        phone,
        methods: { create: { provider: 'LOCAL', identity } },
        permissionGroup: { connect: { permissionGroupId } },
      },
    });

    return user;
  }

  public static async modifyUser(
    user: UserModel,
    props: {
      username: string;
      email: string;
      phone: string;
      password: string;
      permissionGroupId: string;
    }
  ): Promise<UserModel> {
    const schema = Joi.object({
      username: Joi.string().min(2).max(16).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string()
        .regex(/^\+(\d*)$/)
        .messages({
          'string.pattern.base': '+ 로 시작하시는 전화번호를 입력해주세요.',
        })
        .optional(),
      permissionGroupId: Joi.string().uuid().optional(),
      password: Joi.string()
        .regex(
          /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{10,}$/
        )
        .messages({
          'string.pattern.base':
            '대소문자와 숫자, 특수문자가 각 1자 이상 포함된 10자 이상의 비밀번호를 입력해주세요.',
        })
        .optional(),
    });

    const { username, email, phone, password, permissionGroupId } =
      await schema.validateAsync(props);
    const isExists = await Promise.all([
      User.isExistsUserEmail(email),
      User.isExistsUserPhone(phone),
    ]);

    if (email && user.email !== email && isExists[0]) {
      throw new InternalError('사용중인 이메일입니다.', OPCODE.ALREADY_EXISTS);
    }

    if (phone && user.phone !== phone && isExists[1]) {
      throw new InternalError(
        '사용중인 전화번호입니다.',
        OPCODE.ALREADY_EXISTS
      );
    }

    const data: Prisma.UserModelUpdateInput = {
      username,
      email,
      phone,
    };

    if (permissionGroupId) {
      await PermissionGroup.getPermissionGroupOrThrow(permissionGroupId);
      data.permissionGroup = { connect: { permissionGroupId } };
    }

    if (password) {
      const provider = MethodProvider.LOCAL;
      const identity = hashSync(password, 10);
      data.methods = {
        deleteMany: { provider },
        create: { provider, identity },
      };
    }

    const { userId } = user;
    const where = { userId };
    await prisma.userModel.update({ where, data });
    return user;
  }

  public static async getUsers(props: {
    take?: number;
    skip?: number;
    search?: number;
    orderByField?: string;
    orderBySort?: string;
  }): Promise<{ total: number; users: UserModel[] }> {
    const schema = Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      orderByField: Joi.string()
        .optional()
        .valid('username', 'createdAt')
        .default('username'),
      orderBySort: Joi.string().valid('asc', 'desc').default('asc').optional(),
    });

    const { take, skip, search, orderByField, orderBySort } =
      await schema.validateAsync(props);
    const orderBy = { [orderByField]: orderBySort };
    const include = { permissionGroup: { include: { permissions: true } } };
    const where: Prisma.UserModelWhereInput = {
      OR: [
        { username: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ],
    };

    const [total, users] = await prisma.$transaction([
      prisma.userModel.count({ where }),
      prisma.userModel.findMany({
        take,
        skip,
        where,
        orderBy,
        include,
      }),
    ]);

    return { total, users };
  }

  public static async getUserOrThrow(userId: string): Promise<UserModel> {
    const user = await User.getUser(userId);
    if (!user) {
      throw new InternalError(
        '해당 사용자를 찾을 수 없습니다.',
        OPCODE.NOT_FOUND
      );
    }

    return user;
  }

  public static async getUserByEmailOrThrow(email: string): Promise<UserModel> {
    const user = await User.getUserByEmail(email);
    if (!user) {
      throw new InternalError(
        '해당 사용자를 찾을 수 없습니다.',
        OPCODE.NOT_FOUND
      );
    }

    return user;
  }

  public static async getUserByPhone(phone: string): Promise<UserModel | null> {
    const user = await prisma.userModel.findFirst({
      where: { phone },
      include: { permissionGroup: { include: { permissions: true } } },
    });

    return user;
  }

  public static async getUserByPhoneOrThrow(phone: string): Promise<UserModel> {
    const user = await User.getUserByPhone(phone);
    if (!user) {
      throw new InternalError(
        '해당 사용자를 찾을 수 없습니다.',
        OPCODE.NOT_FOUND
      );
    }

    return user;
  }

  public static async getUserByEmail(email: string): Promise<UserModel | null> {
    const user = await prisma.userModel.findFirst({
      where: { email },
      include: { permissionGroup: { include: { permissions: true } } },
    });

    return user;
  }

  public static async getUser(userId: string): Promise<UserModel | null> {
    const user = await prisma.userModel.findFirst({
      where: { userId },
      include: { permissionGroup: { include: { permissions: true } } },
    });

    return user;
  }

  public static async isExistsUserEmail(email: string): Promise<boolean> {
    const exists = await prisma.userModel.count({ where: { email } });
    return exists > 0;
  }

  public static async isExistsUserPhone(phone: string): Promise<boolean> {
    const exists = await prisma.userModel.count({ where: { phone } });
    return exists > 0;
  }

  public static async deleteUser(user: UserModel): Promise<void> {
    const { userId } = user;
    await prisma.userModel.deleteMany({
      where: { userId },
    });
  }
}
