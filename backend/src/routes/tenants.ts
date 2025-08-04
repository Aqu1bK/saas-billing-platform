import { Router } from 'express';
import { createTenant } from '../controllers/tenant';

const router = Router();

router.post('/api/tenants', createTenant);

export default router;