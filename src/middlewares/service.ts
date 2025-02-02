import { Callback, InternalError, OPCODE, Service, Wrapper } from '..';

export function ServiceMiddleware(
  props: { withSecretKey?: boolean } = {}
): Callback {
  return Wrapper(async (req, res, next) => {
    const { serviceId } = req.params;
    const { withSecretKey } = props;
    if (!serviceId) {
      throw new InternalError('서비스를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    req.service = await Service.getServiceOrThrow(serviceId, withSecretKey);
    next();
  });
}
