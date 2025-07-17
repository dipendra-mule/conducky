# Logging Configuration

Conducky provides configurable logging settings that allow system administrators to control how the application logs information for debugging, monitoring, and auditing purposes.

## Overview

The logging configuration system allows you to:
- Set the logging level (error, warn, info, http, debug)
- Control where logs are written (console, files, error files)
- Customize log file paths
- Update settings dynamically without restarting the application

## Setup and Access

### Automatic Initialization

Logging settings are **automatically initialized** during system deployment and startup:

- **Initial Deployment**: Logging settings are seeded automatically via the deployment process
- **Docker Development**: Settings are seeded when containers start up
- **Database Migrations**: Logging settings are created as part of the standard deployment flow

The system will create default logging settings if they don't already exist:
- **Log Level**: `error` (conservative default)
- **Console Logging**: `true` (enabled)
- **File Logging**: `false` (disabled by default)
- **Error File Logging**: `false` (disabled by default)

### Manual Setup (if needed)

If logging settings need to be re-initialized manually:

```bash
# In development (Docker):
docker-compose exec backend npm run seed:logging

# In production deployment:
npm run seed:logging
```

**Note**: The seeding process uses "upsert" operations, so it's safe to run multiple times without creating duplicates.

### Integration with Deployment Process

The logging configuration system is fully integrated with Conducky's deployment and development workflows:

**Automatic Integration:**
- ✅ **Development**: Logging settings seeded during `docker-compose up`
- ✅ **Production Deployment**: Logging settings seeded during Railway/cloud deployment  
- ✅ **Database Migrations**: Included in standard deployment pipeline
- ✅ **Container Startup**: Automatically initialized in `entrypoint.sh`

**Deployment Scripts:**
- `backend/entrypoint.sh` - Development container startup
- `backend/scripts/deploy.sh` - Production deployment (Railway)
- `backend/package.json` - NPM script integration

**Safe Operations:**
- Uses "upsert" operations - safe to run multiple times
- Won't overwrite existing custom settings
- Falls back to hardcoded defaults if database unavailable
- Doesn't break deployments if seeding fails

## Accessing Logging Settings

1. Log in as a System Administrator
2. Navigate to **Admin** → **System** → **Settings**
3. Scroll to the **Logging Configuration** section

## Configuration Options

### Log Level

Controls the minimum level of messages that will be logged. Each level includes all messages from higher priority levels:

- **error** (Level 0): Only critical errors and exceptions
  - Database connection failures
  - Authentication failures
  - Application crashes
  - Security violations

- **warn** (Level 1): Warnings and all errors
  - Deprecated feature usage
  - Invalid configuration detected but recoverable
  - Performance issues detected
  - Failed retry attempts

- **info** (Level 2): General information plus warnings and errors *(recommended for production)*
  - Application startup/shutdown events
  - User login/logout activities
  - Report creation and status changes
  - Email notifications sent
  - System configuration changes

- **http** (Level 3): HTTP request logging plus all above levels
  - All API requests and responses
  - Request timing and response codes
  - Authentication attempts
  - File uploads and downloads

- **debug** (Level 4): Detailed debugging information plus all above levels *(recommended for development)*
  - Function entry/exit points
  - Variable values and state changes
  - Database query execution details
  - External API call details
  - Detailed error stack traces

### Log Destinations

You can enable or disable different output destinations:

#### Console Logging
- **Enabled**: Logs appear in the application console/terminal
- **Disabled**: No console output (useful for production environments)

#### File Logging
- **Enabled**: Logs are written to a combined log file
- **Disabled**: No file logging

#### Error File Logging
- **Enabled**: Error messages are written to a separate error log file
- **Disabled**: Errors are not separately logged to file

### Log File Paths

#### Log File Path
The location where general application logs are stored.
- **Default**: `logs/combined.log` (file logging disabled by default)
- **Example**: `application/logs/app.log`

#### Error Log File Path
The location where error logs are stored separately.
- **Default**: `logs/error.log` (error file logging disabled by default)
- **Example**: `application/logs/errors.log`

## Best Practices

### Default Configuration (Conservative)
The system defaults to a conservative configuration suitable for most environments:
- **Log level**: `error` (only critical errors)
- **Console logging**: Enabled (immediate visibility)
- **File logging**: Disabled (opt-in basis)
- **Error file logging**: Disabled (opt-in basis)

### Production Environment
- Consider increasing log level to **warn** or **info** for better visibility
- Enable file logging for persistence and analysis
- Enable error file logging for dedicated error tracking
- Disable console logging (optional, depending on deployment)
- Use absolute paths for log files

### Development Environment
- Set log level to **debug** for detailed information
- Keep console logging enabled for immediate feedback
- Enable file logging for persistence
- Enable error file logging for debugging

### Security Considerations
- Ensure log directories have appropriate file permissions
- Consider log rotation to prevent disk space issues
- Review logs regularly for security events
- Do not log sensitive information like passwords or API keys

## File Permissions

Make sure the application has write permissions to the log directories:

```bash
# Create log directory if it doesn't exist
mkdir -p logs

# Set appropriate permissions
chmod 755 logs
```

## Log Rotation

For production environments, consider setting up log rotation to manage disk space:

```bash
# Example logrotate configuration
/path/to/conducky/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 conducky conducky
}
```

## API Access

The logging configuration is also available via API for programmatic access:

### Get Current Settings
```http
GET /api/admin/system/logging
Authorization: Bearer <token>
```

### Update Settings
```http
PATCH /api/admin/system/logging
Authorization: Bearer <token>
Content-Type: application/json

{
  "level": "info",
  "destinations": {
    "console": true,
    "file": true,
    "errorFile": true
  },
  "filePath": "logs/combined.log",
  "errorFilePath": "logs/error.log"
}
```

## Troubleshooting

### Settings Not Saving
- Verify you have System Administrator privileges
- Check network connectivity
- Ensure the API endpoint is accessible

### Logs Not Appearing
- Verify the log level is appropriate for the messages you expect
- Check file permissions for log directories
- Ensure destinations are enabled
- Verify file paths are correct and accessible

### Performance Issues
- Consider increasing log level (reduce verbosity) in production
- Implement log rotation
- Monitor disk space usage
- Consider disabling console logging in production

### Invalid Configuration
The system validates all settings before saving:
- Log level must be one of: error, warn, info, http, debug
- File paths cannot be empty when file logging is enabled
- At least one destination must be enabled

## Example Configurations

### High-Traffic Production
```json
{
  "level": "warn",
  "destinations": {
    "console": false,
    "file": true,
    "errorFile": true
  },
  "filePath": "/var/log/conducky/app.log",
  "errorFilePath": "/var/log/conducky/error.log"
}
```

### Development Environment
```json
{
  "level": "debug",
  "destinations": {
    "console": true,
    "file": true,
    "errorFile": true
  },
  "filePath": "logs/dev.log",
  "errorFilePath": "logs/dev-error.log"
}
```

### Minimal Production
```json
{
  "level": "error",
  "destinations": {
    "console": false,
    "file": false,
    "errorFile": true
  },
  "filePath": "logs/combined.log",
  "errorFilePath": "/var/log/conducky/error.log"
}
```

## Related Documentation

- [System Management](/docs/admin-guide/system-management)
- [Database Monitoring](/docs/admin-guide/database-monitoring)
- [Audit Logging](/docs/security/audit-logging)
- [Deployment Guide](/docs/admin-guide/deployment) 