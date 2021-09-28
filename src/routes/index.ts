import { Router } from 'express';
import {
  AuthMiddleware,
  clusterInfo,
  getAuthRouter,
  getPermissionGroupsRouter,
  getPermissionsRouter,
  getServicesRouter,
  getUsersRouter,
  OPCODE,
  Wrapper,
} from '..';

export * from './auth';
export * from './permissions';
export * from './permissionGroups';
export * from './services';
export * from './users';

export function getRouter(): Router {
  const router = Router();

  router.use('/services', AuthMiddleware(), getServicesRouter());
  router.use('/permissions', AuthMiddleware(), getPermissionsRouter());
  router.use('/users', AuthMiddleware(), getUsersRouter());
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
