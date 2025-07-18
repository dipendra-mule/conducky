import { Request, Response } from 'express';
import { AuthService } from '../services';
import logger from '../config/logger';

// Simple user interface that matches what Passport provides
interface AuthUser {
  id: string;
  email: string;
  name: string;
  [key: string]: any; // For other Prisma fields
}

// Using standard Express Request type

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      
      const result = await this.authService.registerUser({ email, password, name });
      
      if (!result.success) {
        // Check if it's a duplicate email error
        if (result.error === 'Email already registered.') {
          res.status(409).json({ error: result.error });
          return;
        }
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({
        message: 'Registration successful!',
        user: result.data?.user
      });
    } catch (error) {
      logger().error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async checkEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;
      
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Log the email check attempt for security monitoring
      logger().info('Email availability check attempted', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        context: 'email_check_attempt'
      });

      const result = await this.authService.checkEmailAvailability(email as string);
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      // Add a small artificial delay to make automated enumeration less efficient
      // Only in production to avoid slowing down tests and development
      if (process.env.NODE_ENV === 'production') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      res.status(200).json({ available: result.data?.available });
    } catch (error) {
      logger().error('Email check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      const result = await this.authService.requestPasswordReset({ email });
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({ message: result.data?.message || 'Request processed' });
    } catch (error) {
      logger().error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async validateResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      
      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const result = await this.authService.validateResetToken(token as string);
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({ valid: true, email: result.data });
    } catch (error) {
      logger().error('Token validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      
      const result = await this.authService.resetPassword({ token, password });
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({ message: result.data?.message || 'Password reset successful' });
    } catch (error) {
      logger().error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any; // Type assertion for user with id property
      const userId = user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await this.authService.getSessionData(userId);
      
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      logger().error('Session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 