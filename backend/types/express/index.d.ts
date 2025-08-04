import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: string;
    tenantPool?: any;
    user?: any; 
  }
}