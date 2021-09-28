import {
  PermissionGroupModel,
  PermissionModel,
  ServiceModel,
  UserModel,
} from '@prisma/client';
import 'express';

declare global {
  namespace Express {
    interface Request {
      loggined: {
        user: UserModel;
        sessionId: string;
      };
      user: UserModel;
      permission: PermissionModel;
      permissionGroup: PermissionGroupModel;
      service: ServiceModel;
    }
  }
}
