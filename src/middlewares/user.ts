import { Callback, InternalError, OPCODE, User, Wrapper } from '..';

export function UserMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { userId } = req.params;
    if (!userId) {
      throw new InternalError(
        '해당 사용자를 찾을 수 없습니다.',
        OPCODE.NOT_FOUND
      );
    }

    req.user = await User.getUserOrThrow(userId);
    next();
  });
}
