import { Router } from 'express';
import { OPCODE, Permission, PermissionMiddleware, Wrapper } from '..';

export function getPermissionsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { total, permissions } = await Permission.getPermissions(req.query);
      res.json({ opcode: OPCODE.SUCCESS, permissions, total });
    })
  );

  router.get(
    '/:permissionId',
    PermissionMiddleware(),
    Wrapper(async (req, res) => {
      const { permission } = req;
      res.json({ opcode: OPCODE.SUCCESS, permission });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const permission = await Permission.createPermission(req.body);
      res.json({ opcode: OPCODE.SUCCESS, permission });
    })
  );

  router.post(
    '/:permissionId',
    PermissionMiddleware(),
    Wrapper(async (req, res) => {
      const permission = await Permission.modifyPermission(
        req.permission,
        req.body
      );

      res.json({ opcode: OPCODE.SUCCESS, permission });
    })
  );

  router.delete(
    '/:permissionId',
    PermissionMiddleware(),
    Wrapper(async (req, res) => {
      await Permission.deletePermission(req.permission);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
