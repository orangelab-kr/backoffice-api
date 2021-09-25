import { Router } from 'express';
import {
  OPCODE,
  PermissionGroup,
  PermissionGroupMiddleware,
  Wrapper,
} from '..';

export function getPermissionGroupsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { total, permissionGroups } =
        await PermissionGroup.getPermissionGroups(req.query);
      res.json({ opcode: OPCODE.SUCCESS, permissionGroups, total });
    })
  );

  router.get(
    '/:permissionGroupId',
    PermissionGroupMiddleware(),
    Wrapper(async (req, res) => {
      const { permissionGroup } = req;
      res.json({ opcode: OPCODE.SUCCESS, permissionGroup });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const permissionGroup = await PermissionGroup.createPermissionGroup(
        req.body
      );

      res.json({ opcode: OPCODE.SUCCESS, permissionGroup });
    })
  );

  router.post(
    '/:permissionGroupId',
    PermissionGroupMiddleware(),
    Wrapper(async (req, res) => {
      const permissionGroup = PermissionGroup.modifyPermissionGroup(
        req.permissionGroup,
        req.body
      );

      res.json({ opcode: OPCODE.SUCCESS, permissionGroup });
    })
  );

  router.delete(
    '/:permissionGroupId',
    PermissionGroupMiddleware(),
    Wrapper(async (req, res) => {
      await PermissionGroup.deletePermissionGroup(req.permissionGroup);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
