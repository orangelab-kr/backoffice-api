import { UserModel } from '.prisma/client';
import 'express';

declare global {
  namespace Express {
    interface Request {
      user: UserModel;
      sessionId: string;
    }
  }
}
