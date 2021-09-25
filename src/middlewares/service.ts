import { Callback, InternalError, OPCODE, Service, Wrapper } from '..';

export function ServiceMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { serviceId } = req.params;
    if (!serviceId) {
      throw new InternalError('서비스를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    req.service = await Service.getServiceOrThrow(serviceId);
    next();
  });
}
