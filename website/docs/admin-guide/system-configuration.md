# System Configuration

Conducky uses database-stored configuration for critical system settings like email and OAuth providers. This allows for dynamic configuration changes without requiring application restarts or code deployments.

## Overview

System configuration is managed through the Admin UI and stored securely in the database with field-level encryption for sensitive data like passwords and API keys.

### Supported Configuration Areas

- **Email Settings**: SMTP, SendGrid, or Console email providers
- **Google OAuth**: Social login with Google accounts
- **GitHub OAuth**: Social login with GitHub accounts

## Encryption Key Setup

### Environment Variable

All sensitive configuration data is encrypted using the `ENCRYPTION_KEY` environment variable:

```bash
ENCRYPTION_KEY=your-secure-encryption-key-here
```

### Requirements

- **Minimum length**: 32 characters
- **Strength**: Use a cryptographically secure random string
- **Production**: Must not contain "dev" or "development" keywords
- **Uniqueness**: Each environment should have its own unique key

### Generating a Secure Key

**Linux/macOS:**
```bash
openssl rand -base64 32
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

**Online Generator:**
Use a reputable online password generator to create a 32+ character random string.

### Security Considerations

⚠️ **Important Security Notes:**

- Never use the default development key in production
- Store the encryption key securely (environment variables, secrets manager)
- Rotating the encryption key requires re-encrypting all stored settings
- Backup your encryption key - lost keys mean lost configuration data

## Email Configuration

### Accessing Email Settings

1. Log in as a SuperAdmin
2. Navigate to **Admin → System Settings**
3. Find the **Email Configuration** card

### Provider Options

#### Console Provider
- **Use case**: Development and testing
- **Behavior**: Logs emails to console instead of sending
- **Configuration**: Only requires from address and name

#### SMTP Provider
- **Use case**: Custom email servers, hosted email services
- **Required settings**:
  - SMTP Host (e.g., `smtp.gmail.com`)
  - SMTP Port (usually 587 or 465)
  - Username and Password
  - Security settings (TLS/SSL)

#### SendGrid Provider
- **Use case**: SendGrid email service
- **Required settings**:
  - SendGrid API Key
  - From address and name

### Testing Email Configuration

Use the **Test Connection** tab to verify your email settings:

1. Configure your email provider settings
2. Save the configuration
3. Click **Test Email Connection**
4. Check the specified email address for the test message

## OAuth Configuration

### Google OAuth Setup

1. **Create Google OAuth Application**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Configure in Conducky**:
   - Navigate to **Admin → System Settings**
   - Find **Google OAuth Configuration** card
   - Enter Client ID and Client Secret
   - Enable Google OAuth
   - Add authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`

### GitHub OAuth Setup

1. **Create GitHub OAuth App**:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Set Authorization callback URL: `https://yourdomain.com/api/auth/github/callback`

2. **Configure in Conducky**:
   - Navigate to **Admin → System Settings**
   - Find **GitHub OAuth Configuration** card
   - Enter Client ID and Client Secret
   - Enable GitHub OAuth

### OAuth Behavior

- **Enabled providers**: Login buttons appear on the login page
- **Disabled providers**: Login buttons are hidden
- **Real-time updates**: Changes take effect immediately without restart

## Migration from Environment Variables

If you're migrating from environment variable-based configuration:

### Email Migration

**Old environment variables:**
```bash
EMAIL_PROVIDER=smtp
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME=MyApp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=username
SMTP_PASSWORD=password
```

**Migration steps:**
1. Access Admin → System Settings
2. Configure email settings through the UI
3. Test the configuration
4. Remove environment variables from your deployment

### OAuth Migration

**Old environment variables:**
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Migration steps:**
1. Access Admin → System Settings
2. Configure OAuth providers through the UI
3. Test login functionality
4. Remove environment variables from your deployment

## Troubleshooting

### Common Issues

**Encryption Key Errors:**
```
❌ Encryption key validation failed: ENCRYPTION_KEY must be at least 32 characters long
```
- Solution: Generate a longer encryption key (32+ characters)

**Email Test Failures:**
- Verify SMTP credentials and server settings
- Check firewall and network connectivity
- Ensure from address is authorized by your email provider

**OAuth Login Issues:**
- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure OAuth apps are active/published

### Logs and Debugging

- **Backend logs**: Check Docker logs for detailed error messages
- **Email testing**: Use the built-in test functionality
- **OAuth debugging**: Check browser network tab for redirect errors

## Security Best Practices

1. **Encryption Key Management**:
   - Use different keys for each environment
   - Store keys in secure secret management systems
   - Never commit keys to version control

2. **Access Control**:
   - Only SuperAdmins can modify system configuration
   - Regular users cannot view sensitive settings

3. **Audit Trail**:
   - Configuration changes are logged
   - Monitor admin access to system settings

4. **Regular Reviews**:
   - Periodically review OAuth app permissions
   - Update API keys and passwords regularly
   - Remove unused OAuth applications

## API Reference

System configuration can also be managed via API:

- `GET /api/admin/system/settings` - Retrieve all settings
- `PUT /api/admin/settings/email` - Update email configuration
- `PUT /api/admin/settings/google-oauth` - Update Google OAuth
- `PUT /api/admin/settings/github-oauth` - Update GitHub OAuth
- `POST /api/admin/settings/email/test` - Test email configuration

All API endpoints require SuperAdmin authentication. 