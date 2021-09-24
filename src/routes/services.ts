import { Router } from 'express';
import { OPCODE, Wrapper } from '..';
import jwt from 'jsonwebtoken';

export function getServicesRouter(): Router {
  const router = Router();

  return router;
}
