import React, { useState, useContext, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { UserContext } from '../_app';
import { Eye, EyeOff, Save, User, Lock, Bell, Shield } from 'lucide-react';
import { isValidEmail } from '@/lib/utils';
import { AuthGuard } from '@/components/shared/AuthGuard';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
  id: string;
  name?: string;
  email: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export default function ProfileSettings() {
  const { user, setUser } = useContext(UserContext) as UserContextType;
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Notification preferences state (now connected to backend)
  const [notifications, setNotifications] = useState({
    reportSubmittedEmail: false,
    reportAssignedEmail: false,
    reportCommentAddedEmail: false,
    // Add more fields if you want to expose more notification types
    pushNotifications: false // Placeholder for future push support
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifSuccess, setNotifSuccess] = useState('');

  // Privacy settings state (placeholder for future implementation)
  const [privacy, setPrivacy] = useState({
    showEmailToTeam: false,
    allowDirectMessages: true
  });

  // Email enabled state
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [emailConfigError, setEmailConfigError] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Fetch notification settings from backend
  useEffect(() => {
    async function fetchNotificationSettings() {
      setNotifLoading(true);
      setNotifError('');
      try {
        const res = await fetch(`${apiUrl}/api/user/notification-settings`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch notification settings');
        const data = await res.json();
        setNotifications({
          reportSubmittedEmail: !!data.reportSubmittedEmail,
          reportAssignedEmail: !!data.reportAssignedEmail,
          reportCommentAddedEmail: !!data.reportCommentAddedEmail,
          pushNotifications: !!data.pushNotifications // fallback for future
        });
      } catch (err) {
        setNotifError('Could not load notification settings.');
      } finally {
        setNotifLoading(false);
      }
    }
    fetchNotificationSettings();
  }, []);

  // Check if email is enabled
  useEffect(() => {
    async function fetchEmailEnabled() {
      try {
        const res = await fetch(`${apiUrl}/api/config/email-enabled`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to check email config');
        const data = await res.json();
        setEmailEnabled(!!data.enabled);
      } catch (err) {
        setEmailEnabled(false);
        setEmailConfigError('Could not determine email notification availability.');
      }
    }
    fetchEmailEnabled();
  }, []);

  // Password strength validation
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      checks: { minLength, hasUpper, hasLower, hasNumber, hasSpecial }
    };
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setEmailError(null);

    // Validate email before submitting
    if (profileForm.email && !isValidEmail(profileForm.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setProfileLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.error || 'Failed to update profile');
        return;
      }

      setUser(data.user);
      setProfileSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileError('Network error. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError('New password must meet all security requirements.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordError('Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Update notification settings in backend
  const handleNotificationChange = async (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
    setNotifLoading(true);
    setNotifError('');
    setNotifSuccess('');
    try {
      const res = await fetch(`${apiUrl}/api/user/notification-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: value })
      });
      if (!res.ok) throw new Error('Failed to update notification settings');
      setNotifSuccess('Notification settings updated.');
    } catch (err) {
      setNotifError('Could not update notification settings.');
    } finally {
      setNotifLoading(false);
    }
  };

  const passwordValidation = validatePassword(passwordForm.newPassword);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProfileForm(prev => ({ ...prev, email: value }));
                        // Validate email in real-time
                        if (value && !isValidEmail(value)) {
                          setEmailError('Please enter a valid email address');
                        } else {
                          setEmailError(null);
                        }
                      }}
                      placeholder="Enter your email address"
                      className={emailError ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                    {emailError && (
                      <p className="text-sm text-red-600">{emailError}</p>
                    )}
                  </div>
                </div>
                
                {profileError && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {profileError}
                  </div>
                )}
                
                {profileSuccess && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {profileSuccess}
                  </div>
                )}
                
                <Button type="submit" disabled={profileLoading || !!emailError} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter your new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {passwordForm.newPassword && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Password requirements:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={passwordValidation.checks.minLength ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          ✓ At least 8 characters
                        </div>
                        <div className={passwordValidation.checks.hasUpper ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          ✓ Uppercase letter
                        </div>
                        <div className={passwordValidation.checks.hasLower ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          ✓ Lowercase letter
                        </div>
                        <div className={passwordValidation.checks.hasNumber ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          ✓ Number
                        </div>
                        <div className={passwordValidation.checks.hasSpecial ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          ✓ Special character
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* Password match indicator */}
                  {passwordForm.confirmPassword && (
                    <div className={`text-xs ${
                      passwordForm.newPassword === passwordForm.confirmPassword 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {passwordForm.newPassword === passwordForm.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </div>
                  )}
                </div>
                
                {passwordError && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {passwordSuccess}
                  </div>
                )}
                
                <Button type="submit" disabled={passwordLoading} className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {notifError && <span className="text-red-500">{notifError}</span>}
                {notifSuccess && <span className="text-green-600">{notifSuccess}</span>}
                {!notifError && !notifSuccess && 'Configure how you want to receive notifications.'}
              </p>
            </CardHeader>
            <CardContent>
              {emailEnabled === false && (
                <div className="mb-4 text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 rounded p-3">
                  Email notifications are currently unavailable. Please contact your administrator if you believe this is an error.
                </div>
              )}
              {emailConfigError && (
                <div className="mb-4 text-red-600 dark:text-red-400">{emailConfigError}</div>
              )}
              <div className="space-y-4">
                {/* Email notification switches, hidden/disabled if email is not enabled */}
                {emailEnabled !== false && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email notifications for new reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when new reports are submitted in your events
                        </p>
                      </div>
                      <Switch
                        checked={!!notifications.reportSubmittedEmail}
                        onCheckedChange={(checked) => handleNotificationChange('reportSubmittedEmail', !!checked)}
                        disabled={notifLoading || emailEnabled === false}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email notifications for assignments</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when reports are assigned to you
                        </p>
                      </div>
                      <Switch
                        checked={!!notifications.reportAssignedEmail}
                        onCheckedChange={(checked) => handleNotificationChange('reportAssignedEmail', !!checked)}
                        disabled={notifLoading || emailEnabled === false}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email notifications for comments</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when someone comments on your incidents
                        </p>
                      </div>
                      <Switch
                        checked={!!notifications.reportCommentAddedEmail}
                        onCheckedChange={(checked) => handleNotificationChange('reportCommentAddedEmail', !!checked)}
                        disabled={notifLoading || emailEnabled === false}
                      />
                    </div>
                    <Separator />
                  </>
                )}
                {/* Push notifications always shown */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications for urgent updates
                    </p>
                  </div>
                  <Switch
                    checked={!!notifications.pushNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('pushNotifications', !!checked)}
                    disabled={notifLoading}
                  />
                </div>
              </div>
              {notifError && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {notifError}
                </div>
              )}
              {notifSuccess && (
                <div className="mt-4 text-sm text-green-600 dark:text-green-400">
                  {notifSuccess}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy & Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Control your privacy and security settings (coming soon)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show email to team members</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other team members to see your email address
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showEmailToTeam}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, showEmailToTeam: checked }))}
                    disabled
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow direct messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other users to send you direct messages
                    </p>
                  </div>
                  <Switch
                    checked={privacy.allowDirectMessages}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allowDirectMessages: checked }))}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}