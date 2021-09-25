import { Callback, InternalError, OPCODE, PermissionGroup, Wrapper } from '..';

export function PermissionGroupMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { permissionGroupId } = req.params;
    if (!permissionGroupId) {
      throw new InternalError(
        '해당 권한 그룹을 찾을 수 없습니다.',
        OPCODE.NOT_FOUND
      );
    }

    req.permissionGroup = await PermissionGroup.getPermissionGroupOrThrow(
      permissionGroupId
    );

    next();
  });
}
