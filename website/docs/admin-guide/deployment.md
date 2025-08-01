---
sidebar_position: 2
---

# Installation & Deployment

This guide covers how to install and deploy Conducky in various environments.

## Prerequisites

Before deploying Conducky, ensure you have:

- **Database**: PostgreSQL 12+ 
- **Node.js**: Version 18+ 
- **Environment Variables**: Properly configured for both backend and frontend

## Environment Variables

Conducky requires specific environment variables to function properly. See the [Developer Docs Introduction](../developer-docs/intro.md#environment-variables-standardized) for the complete list and detailed explanations.

### Quick Reference

**Backend** (`.env` in `/backend`):

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session management
- `FRONTEND_BASE_URL` - URL of your frontend deployment
- `CORS_ORIGIN` - Public URL of frontend for CORS
- `PORT` - Backend port (optional, defaults to 4000)
- `NODE_ENV` - Set this to "production" when running in a production environment
- `ENCRYPTION_KEY` - **REQUIRED** Encryption key for database field-level encryption. Must be at least 32 characters long. Generate with `openssl rand -base64 48`. Used to encrypt incident data, comments, contact emails, and system configuration.

**Frontend** (`.env` in `/frontend`):

- `NEXT_PUBLIC_API_URL` - Backend API URL for client-side calls
- `BACKEND_API_URL` - Backend API URL for server-side calls
- `NODE_ENV` - Set this to "production" when running in a production environment

## Deployment Options

### Deploy with Docker Compose (Recommended)

The easiest way to deploy Conducky is using the included Docker Compose configuration:

```bash
# Clone the repository
git clone https://github.com/mattstratton/conducky.git
cd conducky

# Copy and configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with your configuration

# Start the services
docker-compose up -d
```

### Deploy with Render

1. Fork the Conducky repository to your GitHub account
2. Connect your Render account to GitHub
3. Create a new PostgreSQL database in Render
4. Create two new web services in Render:
   - **Backend**: Point to `/backend`, set environment variables
   - **Frontend**: Point to `/frontend`, set environment variables
5. Configure the environment variables as described above

### Deploy with DigitalOcean App Platform

1. Fork the Conducky repository
2. Create a new app in DigitalOcean App Platform
3. Connect your GitHub repository
4. Configure the app with two components:
   - **Backend API**: Node.js service from `/backend`
   - **Frontend**: Static site from `/frontend` 
5. Add a managed PostgreSQL database
6. Set the required environment variables

### Deploy on AWS

For AWS deployment, you can use:

- **AWS App Runner** for the backend API
- **AWS Amplify** for the frontend
- **Amazon RDS** for PostgreSQL
- **Application Load Balancer** to route traffic

Detailed AWS deployment instructions coming soon.

Also consider the Pulumi program at [mattstratton/conducky-pulumi](https://github.com/mattstratton/conducky-pulumi) for AWS deployment.

## Database Setup

1. Create a PostgreSQL database
2. Set the `DATABASE_URL` environment variable  
3. **Generate and set encryption key**:
   ```bash
   # Generate a secure encryption key
   openssl rand -base64 48
   # Set ENCRYPTION_KEY environment variable with the generated key
   ```
4. Run database migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
5. Seed essential system data (required):
   ```bash
   npm run seed:roles      # Essential user roles
   npm run seed:logging    # Default logging configuration
   ```
6. (Optional) Seed with sample data for development:
   ```bash
   npm run seed           # Includes roles, logging, and test data
   npm run sample-data    # Additional sample organizations and incidents
   ```

## Security Considerations

### Encryption Key Management

**Critical Security Requirements:**

- **Generate unique keys** for each environment (dev/staging/production)
- **Store securely** in your deployment platform's environment variable system  
- **Never commit** encryption keys to version control
- **Backup safely** - loss of encryption key means permanent data loss
- **Rotate periodically** for enhanced security (requires maintenance window)

### Production Security Checklist

- [ ] Generated strong encryption key (64+ characters)
- [ ] Set `NODE_ENV=production` in both frontend and backend
- [ ] Enabled HTTPS/TLS for all communications
- [ ] Configured secure session secret
- [ ] Set up proper CORS origins
- [ ] Enabled database SSL connections
- [ ] Configured secure headers and CSP
- [ ] Set up monitoring and audit log review

For detailed security configuration, see the [Security Overview Guide](security-overview.md).

## Initial Setup

After deployment:

1. **Create the first SystemAdmin user**:
   - When you first access the application, you will be prompted to create a SystemAdmin user.

2. **Create your first event** via the admin interface

3. **Set up invite links** for your team members

## Monitoring & Maintenance

- **Logs**: Check application logs regularly
- **Database**: Monitor PostgreSQL performance and storage
- **Updates**: Keep Conducky updated by pulling the latest changes
- **Backups**: Regularly backup your PostgreSQL database

## Troubleshooting

Common deployment issues:

- **Database connection errors**: Verify `DATABASE_URL` format and database accessibility
- **CORS errors**: Ensure `CORS_ORIGIN` matches your frontend URL exactly
- **Session issues**: Verify `SESSION_SECRET` is set and consistent across restarts

- **File upload issues**: Check disk space and file permissions

For more troubleshooting help, see the [User Guide Troubleshooting](../user-guide/troubleshooting) section. 