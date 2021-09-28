import { Router } from 'express';
import { OPCODE, User, UserMiddleware, Wrapper } from '..';

export function getUsersRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { total, users } = await User.getUsers(req.query);
      res.json({ opcode: OPCODE.SUCCESS, users, total });
    })
  );

  router.get(
    '/:userId',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const user = await User.createUser(req.body);
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/:userId',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const user = await User.modifyUser(req.user, req.body);
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.delete(
    '/:userId',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      await User.deleteUser(req.user);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
