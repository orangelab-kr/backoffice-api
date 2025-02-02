/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { OPCODE } from '.';

export class InternalError extends Error {
  public name = 'InternalError';

  public constructor(
    public message: string,
    public opcode = OPCODE.ERROR,
    public details?: any
  ) {
    super();
  }
}
