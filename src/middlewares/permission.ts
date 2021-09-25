import { Callback, InternalError, OPCODE, Permission, Wrapper } from '..';

export function PermissionMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { permissionId } = req.params;
    if (!permissionId) {
      throw new InternalError(
        `해당 권한을 찾을 수 없습니다.`,
        OPCODE.NOT_FOUND
      );
    }

    req.permission = await Permission.getPermissionOrThrow(permissionId);
    next();
  });
}
