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
      user: UserModel;
      sessionId: string;
      permission: PermissionModel;
      permissionGroup: PermissionGroupModel;
      service: ServiceModel;
    }
  }
}
