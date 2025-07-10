import { Router, Request, Response } from 'express';
import { IncidentService } from '../services/incident.service';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

// Import security middleware
import { reportCreationRateLimit, fileUploadRateLimit } from '../middleware/rate-limit';
import { validateReport, handleValidationErrors } from '../middleware/validation';
import { requireRole } from '../middleware/rbac';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();
const incidentService = new IncidentService(prisma);

// Multer setup for evidence uploads (memory storage, 10MB limit)
const uploadEvidence = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Get evidence files for an incident
router.get('/:incidentId/evidence', async (req: Request, res: Response): Promise<void> => {
  try {
    const { incidentId } = req.params;
    
    const result = await incidentService.getEvidenceFiles(incidentId);
    
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json(result.data);
  } catch (error: any) {
    logger.error('Get evidence files error:', error);
    res.status(500).json({ error: 'Failed to fetch evidence files.' });
  }
});

// Upload evidence files for an incident
router.post('/:incidentId/evidence', fileUploadRateLimit, uploadEvidence.array('evidence'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { incidentId } = req.params;
    
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    // Convert multer files to EvidenceFile format
    const evidenceFiles = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      data: file.buffer
    }));
    
    const result = await incidentService.uploadEvidenceFiles(incidentId, evidenceFiles);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.data);
  } catch (error: any) {
    logger.error('Upload evidence files error:', error);
    res.status(500).json({ error: 'Failed to upload evidence files.' });
  }
});

// Get specific evidence file
router.get('/:incidentId/evidence/:evidenceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { evidenceId } = req.params;
    
    const result = await incidentService.getEvidenceFile(evidenceId);
    
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    const { filename, mimetype, data } = result.data!;
    
    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': data.length.toString()
    });
    
    res.send(data);
  } catch (error: any) {
    logger.error('Get evidence file error:', error);
    res.status(500).json({ error: 'Failed to get evidence file.' });
  }
});

// Delete evidence file
router.delete('/:incidentId/evidence/:evidenceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { evidenceId } = req.params;
    
    const result = await incidentService.deleteEvidenceFile(evidenceId);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.data);
  } catch (error: any) {
    logger.error('Delete evidence file error:', error);
    res.status(500).json({ error: 'Failed to delete evidence file.' });
  }
});

// Update tags for an incident
router.patch('/:incidentId/tags', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { incidentId } = req.params;
    const { tags } = req.body;
    const user = req.user as any;

    if (!user || !user.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!Array.isArray(tags)) {
      res.status(400).json({ error: 'tags must be an array' });
      return;
    }

    const result = await incidentService.updateIncidentTags(incidentId, tags, user.id);

    if (!result.success) {
      if (result.error?.includes('Insufficient permissions')) {
        res.status(403).json({ error: result.error });
        return;
      }
      if (result.error?.includes('not found')) {
        res.status(404).json({ error: result.error });
        return;
      }
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result.data);
  } catch (error: any) {
    logger.error('Error updating incident tags:', error);
    res.status(500).json({ error: 'Failed to update incident tags.' });
  }
});

export default router; 