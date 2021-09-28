import { Router } from 'express';
import { OPCODE, Service, ServiceMiddleware, Wrapper } from '..';

export function getServicesRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { total, services } = await Service.getServices(req.query);
      res.json({ opcode: OPCODE.SUCCESS, services, total });
    })
  );

  router.get(
    '/:serviceId',
    ServiceMiddleware(),
    Wrapper(async (req, res) => {
      const { service } = req;
      res.json({ opcode: OPCODE.SUCCESS, service });
    })
  );

  router.get(
    '/:serviceId/generate',
    ServiceMiddleware({ withSecretKey: true }),
    Wrapper(async (req, res) => {
      const {
        loggined: { user },
        service,
      } = req;

      const accessToken = await Service.generateAccessToken({ user, service });
      res.json({ opcode: OPCODE.SUCCESS, accessToken });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const service = await Service.createService(req.body);
      res.json({ opcode: OPCODE.SUCCESS, service });
    })
  );

  router.post(
    '/:serviceId',
    ServiceMiddleware(),
    Wrapper(async (req, res) => {
      const service = await Service.modifyService(req.service, req.body);
      res.json({ opcode: OPCODE.SUCCESS, service });
    })
  );

  router.delete(
    '/:serviceId',
    ServiceMiddleware(),
    Wrapper(async (req, res) => {
      await Service.deleteService(req.service);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
