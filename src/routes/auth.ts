import { Router } from 'express';
import { AuthMiddleware, OPCODE, Session, User, Wrapper } from '..';

export function getAuthRouter(): Router {
  const router = Router();

  router.get(
    '/',
    AuthMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req.loggined;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/',
    AuthMiddleware(),
    Wrapper(async (req, res) => {
      const { body, loggined } = req;
      delete body.permissionGroupId;
      await User.modifyUser(loggined.user, body);
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
      await Session.revokeAllSession(req.loggined.user);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
