import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Settings, Globe, Mail, Shield, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogger } from '@/hooks/useLogger';

type EmailProvider = 'console' | 'smtp' | 'sendgrid';

interface EmailSettings {
  provider?: EmailProvider;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
  // SMTP settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  smtpTls?: boolean;
  // SendGrid settings
  sendgridApiKey?: string;
}

interface GoogleOAuthSettings {
  clientId?: string;
  clientSecret?: string;
  enabled?: boolean;
}

interface GitHubOAuthSettings {
  clientId?: string;
  clientSecret?: string;
  enabled?: boolean;
}

interface SystemSettings {
  showPublicEventList?: string;
  email?: EmailSettings;
  googleOAuth?: GoogleOAuthSettings;
  githubOAuth?: GitHubOAuthSettings;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'console',
    fromAddress: '',
    fromName: '',
    replyTo: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: false,
    smtpTls: false,
    sendgridApiKey: ''
  });
  const [googleOAuthSettings, setGoogleOAuthSettings] = useState<GoogleOAuthSettings>({
    clientId: '',
    clientSecret: '',
    enabled: false
  });
  const [githubOAuthSettings, setGitHubOAuthSettings] = useState<GitHubOAuthSettings>({
    clientId: '',
    clientSecret: '',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/admin/system/settings',
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || {});
        setEmailSettings(prev => ({
          ...prev,
          ...data.settings?.email
        }));
        setGoogleOAuthSettings(prev => ({
          ...prev,
          ...data.settings?.googleOAuth
        }));
        setGitHubOAuthSettings(prev => ({
          ...prev,
          ...data.settings?.githubOAuth
        }));
      } else {
        setError('Failed to load system settings');
      }
    } catch (error) {
      setError('Network error loading settings');
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/admin/system/settings',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ [key]: value }),
        }
      );

      if (response.ok) {
        setSettings(prev => prev ? { ...prev, [key]: value } : { [key]: value } as SystemSettings);
        setSuccess('Settings updated successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update settings');
      }
    } catch {
      setError('Network error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/admin/settings/email',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(emailSettings),
        }
      );

      if (response.ok) {
        setSuccess('Email settings updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update email settings');
      }
    } catch {
      setError('Network error updating email settings');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/admin/settings/email/test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(emailSettings),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to test email connection');
      }
    } catch {
      setError('Network error testing email connection');
    } finally {
      setTesting(false);
    }
  };

  const updateGoogleOAuthSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/admin/settings/google-oauth',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(googleOAuthSettings),
        }
      );

      if (response.ok) {
        setSuccess('Google OAuth settings updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update Google OAuth settings');
      }
    } catch {
      setError('Network error updating Google OAuth settings');
    } finally {
      setSaving(false);
    }
  };

  const updateGitHubOAuthSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/admin/settings/github-oauth',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(githubOAuthSettings),
        }
      );

      if (response.ok) {
        setSuccess('GitHub OAuth settings updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update GitHub OAuth settings');
      }
    } catch {
      setError('Network error updating GitHub OAuth settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePublicEventListingToggle = (checked: boolean) => {
    updateSetting('showPublicEventList', checked ? 'true' : 'false');
  };

  const handleEmailSettingChange = (key: keyof EmailSettings, value: string | number | boolean) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGoogleOAuthSettingChange = (key: keyof GoogleOAuthSettings, value: string | boolean) => {
    setGoogleOAuthSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGitHubOAuthSettingChange = (key: keyof GitHubOAuthSettings, value: string | boolean) => {
    setGitHubOAuthSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <Card className="w-full max-w-4xl mx-auto p-4 sm:p-8">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading system settings...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>System Settings - Conducky Admin</title>
      </Head>

      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences for your Conducky installation.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Public Event Listing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Public Event Listing
              </CardTitle>
              <CardDescription>
                Control whether unauthenticated users can see all events on the home page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="public-event-listing" className="text-sm font-medium">
                    Show Public Event List
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, unauthenticated users will see all events on the home page. 
                    When disabled, only authenticated users can see events.
                  </p>
                </div>
                <Switch
                  id="public-event-listing"
                  checked={settings?.showPublicEventList === 'true'}
                  onCheckedChange={handlePublicEventListingToggle}
                  disabled={saving}
                />
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p><strong>Current Status:</strong> {settings?.showPublicEventList === 'true' ? 'Enabled' : 'Disabled'}</p>
                <p className="mt-1">
                  {settings?.showPublicEventList === 'true' 
                    ? 'Visitors to your site will see all events on the home page and can view event details.'
                    : 'Visitors must log in to see and access events. Events are invitation-only.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure email provider and settings for sending system notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="configuration" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
                  <TabsTrigger value="test">Test Connection</TabsTrigger>
                </TabsList>

                <TabsContent value="configuration" className="space-y-4 mt-6">
                  {/* Email Provider Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="email-provider">Email Provider *</Label>
                    <Select
                      value={emailSettings.provider || 'console'}
                      onValueChange={(value: EmailProvider) => handleEmailSettingChange('provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select email provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="console">Console (Development)</SelectItem>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {emailSettings.provider === 'console' && 'Emails will be logged to console (development only)'}
                      {emailSettings.provider === 'smtp' && 'Use any SMTP server (Gmail, Outlook, custom server, etc.)'}
                      {emailSettings.provider === 'sendgrid' && 'Use SendGrid email service'}
                    </p>
                  </div>

                  <Separator />

                  {/* General Email Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-address">From Address *</Label>
                      <Input
                        id="from-address"
                        type="email"
                        placeholder="noreply@yourdomain.com"
                        value={emailSettings.fromAddress || ''}
                        onChange={(e) => handleEmailSettingChange('fromAddress', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from-name">From Name</Label>
                      <Input
                        id="from-name"
                        placeholder="Conducky Notifications"
                        value={emailSettings.fromName || ''}
                        onChange={(e) => handleEmailSettingChange('fromName', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="reply-to">Reply-To Address</Label>
                      <Input
                        id="reply-to"
                        type="email"
                        placeholder="support@yourdomain.com"
                        value={emailSettings.replyTo || ''}
                        onChange={(e) => handleEmailSettingChange('replyTo', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Provider-specific settings */}
                  {emailSettings.provider === 'smtp' && (
                    <>
                      <Separator />
                      <h4 className="font-medium">SMTP Settings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-host">SMTP Host *</Label>
                          <Input
                            id="smtp-host"
                            placeholder="smtp.gmail.com"
                            value={emailSettings.smtpHost || ''}
                            onChange={(e) => handleEmailSettingChange('smtpHost', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-port">SMTP Port *</Label>
                          <Input
                            id="smtp-port"
                            type="number"
                            placeholder="587"
                            value={emailSettings.smtpPort || ''}
                            onChange={(e) => handleEmailSettingChange('smtpPort', parseInt(e.target.value) || 587)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-username">SMTP Username</Label>
                          <Input
                            id="smtp-username"
                            placeholder="your-email@domain.com"
                            value={emailSettings.smtpUsername || ''}
                            onChange={(e) => handleEmailSettingChange('smtpUsername', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-password">SMTP Password</Label>
                          <div className="relative">
                            <Input
                              id="smtp-password"
                              type="password"
                              placeholder="••••••••"
                              value={emailSettings.smtpPassword || ''}
                              onChange={(e) => handleEmailSettingChange('smtpPassword', e.target.value)}
                            />
                            {emailSettings.smtpPassword && (
                              <Shield className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {emailSettings.smtpPassword ? '🔒 Password will be encrypted when saved' : 'Password is required for authentication'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Security Options</Label>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="smtp-secure"
                            checked={emailSettings.smtpSecure || false}
                            onChange={(e) => handleEmailSettingChange('smtpSecure', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="smtp-secure" className="text-sm">
                            Use SSL/TLS (recommended for port 465)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="smtp-tls"
                            checked={emailSettings.smtpTls || false}
                            onChange={(e) => handleEmailSettingChange('smtpTls', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="smtp-tls" className="text-sm">
                            Allow self-signed certificates
                          </Label>
                        </div>
                      </div>
                    </>
                  )}

                  {emailSettings.provider === 'sendgrid' && (
                    <>
                      <Separator />
                      <h4 className="font-medium">SendGrid Settings</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sendgrid-api-key">SendGrid API Key *</Label>
                        <div className="relative">
                          <Input
                            id="sendgrid-api-key"
                            type="password"
                            placeholder="SG.••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                            value={emailSettings.sendgridApiKey || ''}
                            onChange={(e) => handleEmailSettingChange('sendgridApiKey', e.target.value)}
                          />
                          {emailSettings.sendgridApiKey && (
                            <Shield className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {emailSettings.sendgridApiKey ? '🔒 API key will be encrypted when saved' : 'Get your API key from SendGrid dashboard'}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={updateEmailSettings}
                      disabled={saving || !emailSettings.fromAddress || (
                        emailSettings.provider === 'smtp' && (!emailSettings.smtpHost || !emailSettings.smtpPort)
                      ) || (
                        emailSettings.provider === 'sendgrid' && !emailSettings.sendgridApiKey
                      )}
                    >
                      {saving ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="test" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Current Configuration</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Provider:</strong> {emailSettings.provider || 'Not configured'}</p>
                        <p><strong>From:</strong> {emailSettings.fromAddress || 'Not configured'}</p>
                        {emailSettings.provider === 'smtp' && (
                          <>
                            <p><strong>SMTP Host:</strong> {emailSettings.smtpHost || 'Not configured'}</p>
                            <p><strong>SMTP Port:</strong> {emailSettings.smtpPort || 'Not configured'}</p>
                          </>
                        )}
                        {emailSettings.provider === 'sendgrid' && (
                          <p><strong>SendGrid API Key:</strong> {emailSettings.sendgridApiKey ? 'Configured' : 'Not configured'}</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={testEmailConnection}
                      disabled={testing || !emailSettings.fromAddress}
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {testing ? 'Testing Connection...' : 'Test Email Connection'}
                    </Button>

                    {testResult && (
                      <Alert variant={testResult.success ? "default" : "destructive"}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p><strong>{testResult.message}</strong></p>
                            {testResult.details && <p className="text-sm">{testResult.details}</p>}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><strong>Note:</strong> This test validates your email configuration:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Console:</strong> No actual connection test needed</li>
                        <li><strong>SMTP:</strong> Tests connection and authentication with your SMTP server</li>
                        <li><strong>SendGrid:</strong> Validates API key format (full validation requires API call)</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Google OAuth Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Google OAuth Configuration
              </CardTitle>
              <CardDescription>
                Configure Google OAuth for social login functionality. Users can sign in with their Google accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="google-oauth-enabled"
                  checked={googleOAuthSettings.enabled || false}
                  onCheckedChange={(checked) => handleGoogleOAuthSettingChange('enabled', checked)}
                />
                <Label htmlFor="google-oauth-enabled" className="text-sm font-medium">
                  Enable Google OAuth
                </Label>
              </div>

              {googleOAuthSettings.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-client-id">Google Client ID *</Label>
                    <Input
                      id="google-client-id"
                      placeholder="123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
                      value={googleOAuthSettings.clientId || ''}
                      onChange={(e) => handleGoogleOAuthSettingChange('clientId', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this from your Google Cloud Console OAuth 2.0 credentials
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-client-secret">Google Client Secret *</Label>
                    <div className="relative">
                      <Input
                        id="google-client-secret"
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        value={googleOAuthSettings.clientSecret || ''}
                        onChange={(e) => handleGoogleOAuthSettingChange('clientSecret', e.target.value)}
                      />
                      {googleOAuthSettings.clientSecret && (
                        <Shield className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {googleOAuthSettings.clientSecret ? '🔒 Client secret will be encrypted when saved' : 'Client secret is required for Google OAuth'}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">OAuth Callback URL</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add this URL to your Google OAuth application&apos;s authorized redirect URIs:
                    </p>
                    <code className="text-xs bg-background p-2 rounded border block">
                      {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/google/callback
                    </code>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={updateGoogleOAuthSettings}
                      disabled={saving || !googleOAuthSettings.clientId || !googleOAuthSettings.clientSecret}
                    >
                      {saving ? 'Saving...' : 'Save Google OAuth Settings'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GitHub OAuth Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                GitHub OAuth Configuration
              </CardTitle>
              <CardDescription>
                Configure GitHub OAuth for social login functionality. Users can sign in with their GitHub accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="github-oauth-enabled"
                  checked={githubOAuthSettings.enabled || false}
                  onCheckedChange={(checked) => handleGitHubOAuthSettingChange('enabled', checked)}
                />
                <Label htmlFor="github-oauth-enabled" className="text-sm font-medium">
                  Enable GitHub OAuth
                </Label>
              </div>

              {githubOAuthSettings.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="github-client-id">GitHub Client ID *</Label>
                    <Input
                      id="github-client-id"
                      placeholder="Iv1.1234567890abcdef"
                      value={githubOAuthSettings.clientId || ''}
                      onChange={(e) => handleGitHubOAuthSettingChange('clientId', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this from your GitHub OAuth App settings
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github-client-secret">GitHub Client Secret *</Label>
                    <div className="relative">
                      <Input
                        id="github-client-secret"
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        value={githubOAuthSettings.clientSecret || ''}
                        onChange={(e) => handleGitHubOAuthSettingChange('clientSecret', e.target.value)}
                      />
                      {githubOAuthSettings.clientSecret && (
                        <Shield className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {githubOAuthSettings.clientSecret ? '🔒 Client secret will be encrypted when saved' : 'Client secret is required for GitHub OAuth'}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">OAuth Callback URL</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Set this URL as the Authorization callback URL in your GitHub OAuth App:
                    </p>
                    <code className="text-xs bg-background p-2 rounded border block">
                      {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/github/callback
                    </code>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={updateGitHubOAuthSettings}
                      disabled={saving || !githubOAuthSettings.clientId || !githubOAuthSettings.clientSecret}
                    >
                      {saving ? 'Saving...' : 'Save GitHub OAuth Settings'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Changes to system settings take effect immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 