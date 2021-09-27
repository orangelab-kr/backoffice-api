import {
  MethodModel,
  MethodProvider,
  PermissionGroupModel,
  PermissionModel,
  SessionModel,
  UserModel,
} from '@prisma/client';
import { compareSync } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { InternalError, Joi, OPCODE, prisma, User } from '..';

export class Session {
  public static async loginUserByEmail(props: {
    email: string;
    password: string;
  }): Promise<UserModel> {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string()
          .regex(
            /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{10,}$/
          )
          .messages({
            'string.pattern.base':
              '대소문자와 숫자, 특수문자가 각 1자 이상 포함된 10자 이상의 비밀번호를 입력해주세요.',
          }),
      });

      const provider = MethodProvider.LOCAL;
      const { email, password } = await schema.validateAsync(props);
      const user = await User.getUserByEmailOrThrow(email);
      const method = await Session.getMethodOrThrow(user, provider);
      if (!compareSync(password, method.identity)) {
        throw new InternalError(
          '비밀번호가 일치하지 않습니다.',
          OPCODE.NOT_FOUND
        );
      }

      return user;
    } catch (err: any) {
      console.log(err);
      throw new InternalError(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
        OPCODE.NOT_FOUND
      );
    }
  }

  public static async loginUserByPhone(props: {
    phone: string;
    password: string;
  }): Promise<UserModel> {
    try {
      const schema = Joi.object({
        phone: Joi.string()
          .regex(/^\+(\d*)$/)
          .messages({
            'string.pattern.base': '+ 로 시작하시는 전화번호를 입력해주세요.',
          }),
        password: Joi.string()
          .regex(
            /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{10,}$/
          )
          .messages({
            'string.pattern.base':
              '대소문자와 숫자, 특수문자가 각 1자 이상 포함된 10자 이상의 비밀번호를 입력해주세요.',
          }),
      });

      const provider = MethodProvider.LOCAL;
      const { phone, password } = await schema.validateAsync(props);
      const user = await User.getUserByPhoneOrThrow(phone);
      const method = await Session.getMethodOrThrow(user, provider);
      if (!compareSync(password, method.identity)) {
        throw new InternalError(
          '비밀번호가 일치하지 않습니다.',
          OPCODE.NOT_FOUND
        );
      }

      return user;
    } catch (err: any) {
      throw new InternalError(
        '전화번호 또는 비밀번호가 올바르지 않습니다.',
        OPCODE.NOT_FOUND
      );
    }
  }

  public static async createSession(
    user: UserModel,
    userAgent?: string
  ): Promise<string> {
    const { userId } = user;
    const sessionId = await Session.generateSessionId();
    await prisma.sessionModel.create({
      data: { sessionId, userId, userAgent },
    });

    return sessionId;
  }

  public static async revokeAllSession(user: UserModel): Promise<void> {
    const { userId } = user;
    await prisma.sessionModel.deleteMany({
      where: { userId },
    });
  }

  private static async generateSessionId() {
    let sessionId;
    while (true) {
      sessionId = randomBytes(95).toString('base64');
      const session = await prisma.sessionModel.findFirst({
        where: { sessionId },
      });

      if (!session) break;
    }

    return sessionId;
  }

  public static async getMethodOrThrow(
    user: UserModel,
    provider: MethodProvider
  ): Promise<MethodModel> {
    const method = await Session.getMethod(user, provider);
    if (!method) {
      throw new InternalError('해당 인증 메서드가 없습니다.', OPCODE.NOT_FOUND);
    }

    return method;
  }

  public static async getMethod(
    user: UserModel,
    provider: MethodProvider
  ): Promise<MethodModel | null> {
    const { userId } = user;
    const method = await prisma.methodModel.findFirst({
      where: { userId, provider },
    });

    return method;
  }

  public static async getSession(sessionId: string): Promise<
    SessionModel & {
      user: UserModel & {
        permissionGroup: PermissionGroupModel & {
          permissions: PermissionModel[];
        };
      };
    }
  > {
    const session = await prisma.sessionModel.findFirst({
      where: { sessionId },
      include: {
        user: {
          include: { permissionGroup: { include: { permissions: true } } },
        },
      },
    });

    if (!session) {
      throw new InternalError(
        '로그아웃되었습니다. 다시 로그인해주세요.',
        OPCODE.REQUIRED_LOGIN
      );
    }

    return session;
  }
}
