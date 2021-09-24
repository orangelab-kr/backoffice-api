import { Router } from 'express';
import {
  AuthMiddleware,
  clusterInfo,
  getAuthRouter,
  getServicesRouter,
  OPCODE,
  Wrapper,
} from '..';

export * from './auth';
export * from './services';

export function getRouter(): Router {
  const router = Router();

  router.use('/services', AuthMiddleware(), getServicesRouter());
  router.use('/auth', getAuthRouter());
  router.get(
    '/',
    Wrapper(async (req, res) => {
      res.json({ opcode: OPCODE.SUCCESS, ...clusterInfo });
    })
  );

  return router;
}
