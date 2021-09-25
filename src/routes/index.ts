import { Router } from 'express';
import {
  AuthMiddleware,
  clusterInfo,
  getAuthRouter,
  getPermissionGroupsRouter,
  getPermissionsRouter,
  getServicesRouter,
  OPCODE,
  Wrapper,
} from '..';

export * from './auth';
export * from './services';
export * from './permissions';
export * from './permissionGroups';

export function getRouter(): Router {
  const router = Router();

  router.use('/services', AuthMiddleware(), getServicesRouter());
  router.use('/permissions', AuthMiddleware(), getPermissionsRouter());
  router.use('/auth', getAuthRouter());
  router.use(
    '/permissionGroups',
    AuthMiddleware(),
    getPermissionGroupsRouter()
  );

  router.get(
    '/',
    Wrapper(async (req, res) => {
      res.json({ opcode: OPCODE.SUCCESS, ...clusterInfo });
    })
  );

  return router;
}
