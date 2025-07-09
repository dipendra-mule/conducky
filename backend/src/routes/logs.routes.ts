import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../config/logger';

const router = Router();

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Receive frontend logs
 *     description: Endpoint for frontend applications to send structured logs for centralized logging
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - message
 *               - timestamp
 *               - source
 *             properties:
 *               level:
 *                 type: number
 *                 description: Log level (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)
 *               message:
 *                 type: string
 *                 description: Log message
 *               context:
 *                 type: object
 *                 description: Additional context data
 *               error:
 *                 type: object
 *                 description: Error object if applicable
 *               data:
 *                 type: object
 *                 description: Additional data payload
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: When the log was created
 *               source:
 *                 type: string
 *                 enum: [frontend]
 *                 description: Source of the log
 *     responses:
 *       200:
 *         description: Log received successfully
 *       400:
 *         description: Invalid log data
 *       500:
 *         description: Internal server error
 */
router.post('/logs',  // Validation
  [
    body('level').isInt({ min: 0, max: 4 }).withMessage('Level must be an integer between 0-4'),
    body('message').isString().isLength({ min: 1, max: 1000 }).withMessage('Message must be a string (1-1000 chars)'),
    body('timestamp').isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
    body('source').equals('frontend').withMessage('Source must be "frontend"'),
    body('context').optional().isObject().custom((value) => {
      // Limit context object size to prevent memory issues
      const contextString = JSON.stringify(value || {});
      if (contextString.length > 10000) { // 10KB limit
        throw new Error('Context object too large (max 10KB)');
      }
      return true;
    }),
    body('data').optional().custom((value) => {
      // Limit data payload size to prevent memory issues  
      if (value !== null && value !== undefined) {
        const dataString = JSON.stringify(value);
        if (dataString.length > 50000) { // 50KB limit
          throw new Error('Data payload too large (max 50KB)');
        }
      }
      return true;
    }),
    body('error').optional().isObject().custom((value) => {
      // Limit error object size
      const errorString = JSON.stringify(value || {});
      if (errorString.length > 5000) { // 5KB limit
        throw new Error('Error object too large (max 5KB)');
      }
      return true;
    })
  ],
  async (req: Request, res: Response) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Invalid log data',
          errors: errors.array()
        });
      }

      const { level, message, context, error, data, timestamp, source } = req.body;

      // Map frontend log levels to backend logger methods
      const logLevels = ['debug', 'info', 'warn', 'error'];
      const logMethod = logLevels[level] || 'info';

      // Prepare log data
      const logData = {
        source: 'frontend',
        timestamp,
        context: {
          ...context,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          referer: req.get('Referer')
        },
        ...(data && { data }),
        ...(error && { error })
      };

      // Log to backend logger with appropriate level
      logger[logMethod as keyof typeof logger](`[Frontend] ${message}`, logData);

      res.status(200).json({ 
        message: 'Log received successfully',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Error processing frontend log', { error: err });
      res.status(500).json({ 
        message: 'Internal server error processing log'
      });
    }
  }
);

export default router;
