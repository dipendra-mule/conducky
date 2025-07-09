import express from 'express';
import { requireAuth } from '../middleware/auth';
import { 
  getEventAuditLogs, 
  getOrganizationAuditLogs, 
  getSystemAuditLogs 
} from '../controllers/audit.controller';

const router = express.Router();

// All audit endpoints require authentication
router.use(requireAuth);

// Event audit logs
router.get('/events/:eventId/audit', getEventAuditLogs);

// Organization audit logs
router.get('/organizations/:organizationId/audit', getOrganizationAuditLogs);

// System-wide audit logs (System Admin only)
router.get('/system/audit', getSystemAuditLogs);

export default router;
