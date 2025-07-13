import { Router, Request, Response } from 'express';
import { IncidentService } from '../../services/incident.service';
import { EventService } from '../../services/event.service';
import { requireEventRole } from '../../middleware/unified-rbac';
import { requireRole } from '../../middleware/rbac';
import { UserResponse } from '../../types';
import { PrismaClient } from '@prisma/client';
import { createUploadMiddleware } from '../../utils/upload';
import { reportCreationRateLimit, fileUploadRateLimit } from '../../middleware/rate-limit';
import { validateReport, handleValidationErrors } from '../../middleware/validation';
import logger from '../../config/logger';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const incidentService = new IncidentService(prisma);
const eventService = new EventService(prisma);

const uploadRelatedFile = createUploadMiddleware({
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'text/plain'],
    maxSizeMB: 10,
    allowedExtensions: ['png', 'jpg', 'jpeg', 'pdf', 'txt']
});

// Create a new incident within an event
router.post(
    '/',
    reportCreationRateLimit,
    requireRole(['reporter', 'responder', 'event_admin', 'system_admin']),
    uploadRelatedFile.array('relatedFiles'),
    validateReport,
    handleValidationErrors,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { eventId, slug } = req.params;
            const user = req.user as UserResponse;
            const { title, description, incidentAt, location, involvedParties, severity } = req.body;
            const multerFiles = req.files as Express.Multer.File[] | undefined;

            let currentEventId = eventId;
            if (slug) {
                const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
                if (!eventIdFromSlug) {
                    res.status(404).json({ error: 'Event not found.' });
                    return;
                }
                currentEventId = eventIdFromSlug;
            }

            if (!currentEventId) {
                res.status(400).json({ error: 'Event ID or slug is required.' });
                return;
            }

            const incidentData = {
                eventId: currentEventId,
                reporterId: user.id,
                title,
                description,
                incidentAt: incidentAt ? new Date(incidentAt) : null,
                location,
                parties: involvedParties,
                urgency: severity,
            };

            const relatedFiles = multerFiles?.map(file => ({
                filename: file.originalname,
                mimetype: file.mimetype,
                data: file.buffer,
                size: file.size,
                uploaderId: user.id,
            }));

            const result = await incidentService.createIncident(incidentData, relatedFiles);

            if (result.success) {
                res.status(201).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error: any) {
            logger.error('Create incident error:', error);
            res.status(500).json({ error: 'Failed to create incident.' });
        }
    }
);

// Bulk update incidents
router.post(
    '/bulk',
    requireRole(['event_admin', 'system_admin']),
    async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const { incidentIds, action, ...options } = req.body;
            const user = req.user as UserResponse;

            const result = await incidentService.bulkUpdateIncidents(
                eventId,
                incidentIds,
                action,
                { ...options, userId: user.id }
            );

            if (result.success) {
                res.status(200).json(result.data);
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            logger.error('Failed to bulk update incidents', {
                error,
                eventId: req.params.eventId,
                userId: (req.user as UserResponse)?.id,
            });
            res.status(500).json({ error: 'Failed to bulk update incidents' });
        }
    }
);

// Get all incidents for an event
router.get('/', requireRole(['reporter', 'responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, slug } = req.params;
        const queryOptions = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
            sort: req.query.sort as string || 'incidentAt',
            order: req.query.order as string || 'desc',
            filter: req.query.filter as string || '',
            search: req.query.search as string || '',
        };

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }

        if (!currentEventId) {
            res.status(400).json({ error: 'Event ID or slug is required.' });
            return;
        }

        const result = await incidentService.getIncidentsByEventId(currentEventId, queryOptions);

        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Get event incidents error:', error);
        res.status(500).json({ error: 'Failed to get event incidents.' });
    }
});


// Get a specific incident
router.get('/:incidentId', requireRole(['reporter', 'responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, slug, incidentId } = req.params;
        const user = req.user as any;

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }

        const accessResult = await incidentService.checkIncidentAccess(user.id, incidentId, currentEventId);
        if (!accessResult.success || !accessResult.data?.hasAccess) {
            res.status(403).json({ error: accessResult.error || 'Forbidden: insufficient role' });
            return;
        }

        const result = await incidentService.getIncidentById(incidentId);

        if (result.success) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Get incident details error:', error);
        res.status(500).json({ error: 'Failed to get incident details.' });
    }
});

// Upload related files for an incident
router.post('/:incidentId/related-files', fileUploadRateLimit, requireRole(['reporter', 'responder', 'event_admin', 'system_admin']), uploadRelatedFile.array('relatedFiles'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, slug, incidentId } = req.params;
        const user = req.user as any;
        const relatedFiles = req.files as Express.Multer.File[];

        if (!relatedFiles || relatedFiles.length === 0) {
            res.status(400).json({ error: 'No files uploaded.' });
            return;
        }

        let currentEventId = eventId;
        if (slug) {
             const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }

        const accessResult = await incidentService.checkIncidentAccess(user.id, incidentId, currentEventId);
        if (!accessResult.success || !accessResult.data) {
            res.status(403).json({ error: accessResult.error });
            return;
        }
        
        const incidentAccessData = accessResult.data;

        // For reporters, ensure they can only upload files to their own incidents
        if (incidentAccessData.roles.some((roleName: string) => roleName === 'reporter') && incidentAccessData.isReporter) {
            const incidentResult = await incidentService.getIncidentById(incidentId);
            if (!incidentResult.success || !incidentResult.data) {
                res.status(404).json({ error: 'Incident not found.' });
                return;
            }
            if (incidentResult.data.incident.reporterId !== user.id) {
                res.status(403).json({ error: 'Reporters can only upload files to their own incidents.' });
                return;
            }
        }

        const relatedFilesData = relatedFiles.map(file => ({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            data: file.buffer,
            uploaderId: user.id
        }));

        const result = await incidentService.uploadRelatedFiles(incidentId, relatedFilesData);

        if (result.success) {
            logger.info('Successfully uploaded related files');
            res.status(201).json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Upload related files error:', error);
        res.status(500).json({ error: 'Failed to upload related files.' });
    }
});

// Download a related file
router.get('/:incidentId/related-files/:fileId/download', requireEventRole(['reporter', 'responder', 'event_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, slug, incidentId, fileId } = req.params;
        const user = req.user as any;

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }

        const accessResult = await incidentService.checkIncidentAccess(user.id, incidentId, currentEventId);
        if (!accessResult.success || !accessResult.data?.hasAccess) {
            res.status(403).json({ error: accessResult.error || 'Forbidden: insufficient role' });
            return;
        }

        const result = await incidentService.getRelatedFile(fileId);

        if (result.success && result.data) {
            res.setHeader('Content-Disposition', 'attachment; filename=' + result.data.filename);
            res.setHeader('Content-Type', result.data.mimetype);
            res.setHeader('Content-Length', result.data.size.toString());
            res.send(result.data.data);
        } else {
            res.status(404).json({ error: result.error || 'File not found.' });
        }
    } catch (error: any) {
        logger.error('Download file error:', error);
        res.status(500).json({ error: 'Failed to download file.' });
    }
});

// Delete a related file
router.delete('/:incidentId/related-files/:fileId', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, slug, incidentId, fileId } = req.params;
        const user = req.user as any;
        
        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }
        
        const accessResult = await incidentService.checkIncidentAccess(user.id, incidentId, currentEventId);
        if (!accessResult.success || !accessResult.data?.hasAccess) {
            res.status(403).json({ error: accessResult.error || 'Forbidden: insufficient role' });
            return;
        }

        const result = await incidentService.deleteRelatedFile(fileId);

        if (result.success) {
            res.status(200).json({ message: result.data?.message });
        } else {
            res.status(404).json({ error: result.error || 'File not found or failed to delete.' });
        }
    } catch (error: any) {
        logger.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});

// Update an incident
router.patch('/:incidentId', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, incidentId, slug } = req.params;
        const user = req.user as any;
        const updateData = req.body;

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }
        
        const canEditResult = await incidentService.checkIncidentEditAccess(user.id, incidentId, currentEventId);
        if (!canEditResult.success || !canEditResult.data?.canEdit) {
            res.status(403).json({ error: canEditResult.error || 'You are not authorized to edit this incident.' });
            return;
        }

        const result = await incidentService.updateIncident(slug, incidentId, updateData);

        if (result.success && result.data) {
            if (result.data.originalAssignedResponderId !== result.data.incident.assignedResponderId ||
                result.data.originalState !== result.data.incident.state) {
                // To-do: Add Notifications
            }
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Update incident error:', error);
        res.status(500).json({ error: 'Failed to update incident.' });
    }
});


// Update incident state
router.patch('/:incidentId/state', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, incidentId, slug } = req.params;
        const { state, notes, assignedToUserId } = req.body;
        const user = req.user as any;

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }
        
        const canEditResult = await incidentService.checkIncidentEditAccess(user.id, incidentId, currentEventId);
        if (!canEditResult.success || !canEditResult.data?.canEdit) {
            res.status(403).json({ error: canEditResult.error || 'You are not authorized to change this incident\'s state.' });
            return;
        }

        const result = await incidentService.updateIncidentState(currentEventId, incidentId, state, user.id, notes, assignedToUserId);

        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Update incident state error:', error);
        res.status(500).json({ error: 'Failed to update incident state.' });
    }
});


// Get incident state history
router.get('/:incidentId/history', requireRole(['reporter', 'responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, slug, incidentId } = req.params;
        const user = req.user as any;

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }

        const accessResult = await incidentService.checkIncidentAccess(user.id, incidentId, currentEventId);
        if (!accessResult.success || !accessResult.data?.hasAccess) {
            res.status(403).json({ error: accessResult.error || 'Forbidden: insufficient role' });
            return;
        }

        const result = await incidentService.getIncidentStateHistory(incidentId);

        if (result.success) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Get incident history error:', error);
        res.status(500).json({ error: 'Failed to get incident history.' });
    }
});

// Assign or update incident details (severity, resolution, assignee)
router.patch('/:incidentId/assignment', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, incidentId, slug } = req.params;
        const user = req.user as any;
        const { assignedResponderId, severity, resolution } = req.body;

        let currentEventId = eventId;
        if (slug) {
            const eventIdFromSlug = await eventService.getEventIdBySlug(slug);
            if (!eventIdFromSlug) {
                res.status(404).json({ error: 'Event not found.' });
                return;
            }
            currentEventId = eventIdFromSlug;
        }
        
        const canEditResult = await incidentService.checkIncidentEditAccess(user.id, incidentId, currentEventId);
        if (!canEditResult.success || !canEditResult.data?.canEdit) {
            res.status(403).json({ error: canEditResult.error || 'You are not authorized to update this incident.' });
            return;
        }

        const result = await incidentService.updateIncident(slug, incidentId, {
            assignedResponderId,
            severity,
            resolution
        });

        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Update incident assignment error:', error);
        res.status(500).json({ error: 'Failed to update incident assignment.' });
    }
});

// Add tags to an incident
router.post('/:incidentId/tags', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { incidentId } = req.params;
        const { tagIds } = req.body;
        const user = req.user as UserResponse;
        
        if (!tagIds || !Array.isArray(tagIds)) {
            res.status(400).json({ error: 'tagIds must be an array of strings.' });
            return;
        }
        
        const result = await incidentService.updateIncidentTags(incidentId, tagIds, user.id);

        if (result.success) {
            res.status(200).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Error adding tags to incident:', error);
        res.status(500).json({ error: 'Failed to add tags to incident.' });
    }
});


// Remove a tag from an incident
router.delete('/:incidentId/tags/:tagId', requireRole(['responder', 'event_admin', 'system_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { incidentId, tagId } = req.params;
        const user = req.user as UserResponse;

        // Fetch current tags to perform removal
        const incidentResult = await incidentService.getIncidentById(incidentId);
        if (!incidentResult.success || !incidentResult.data) {
            res.status(404).json({ error: 'Incident not found.' });
            return;
        }
        const currentTagIds = incidentResult.data.incident.tags?.map(t => t.id) || [];
        const newTagIds = currentTagIds.filter(id => id !== tagId);

        const result = await incidentService.updateIncidentTags(incidentId, newTagIds, user.id);
        
        if (result.success) {
            res.status(200).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        logger.error('Error removing tag from incident:', error);
        res.status(500).json({ error: 'Failed to remove tag from incident.' });
    }
});


export default router;