import { Router } from 'express';
import { AuthMiddleware, OPCODE, Session, User, Wrapper } from '..';

export function getAuthRouter(): Router {
  const router = Router();

  router.get(
    '/',
    AuthMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/',
    AuthMiddleware(),
    Wrapper(async (req, res) => {
      const { body, user } = req;
      delete body.permissionGroupId;
      await User.modifyUser(user, body);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.post(
    '/email',
    Wrapper(async (req, res) => {
      const { headers, body } = req;
      const userAgent = headers['user-agent'];
      const user = await Session.loginUserByEmail(body);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId });
    })
  );

  router.post(
    '/phone',
    Wrapper(async (req, res) => {
      const { headers, body } = req;
      const userAgent = headers['user-agent'];
      const user = await Session.loginUserByPhone(body);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId });
    })
  );

  router.delete(
    '/',
    AuthMiddleware(),
    Wrapper(async (req, res) => {
      await Session.revokeAllSession(req.user);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
