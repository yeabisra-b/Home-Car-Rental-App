import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getOwnerStats, getTenantStats, getActivities } from '../controllers/DashboardController';

const router = Router();

router.use(authenticateToken);

router.get('/owner/stats', getOwnerStats);
router.get('/tenant/stats', getTenantStats);
router.get('/activities', getActivities);

export default router;
