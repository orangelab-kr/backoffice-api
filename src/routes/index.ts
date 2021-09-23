import { Router } from 'express';
import { clusterInfo, OPCODE, Wrapper } from '..';

export function getRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      res.json({ opcode: OPCODE.SUCCESS, ...clusterInfo });
    })
  );

  return router;
}
