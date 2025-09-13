import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Database, 
  Eye, 
  Upload, 
  Download, 
  Trash2, 
  Key,
  History,
  AlertTriangle,
  Save,
  Camera,
  Mail,
  Lock,
  Timer,
  HardDrive,
  FileText
} from 'lucide-react';

import type { AccountPreferences as AccountPrefs } from '@/types/user';
import { cn } from '@/lib/utils';

interface AccountSettingsProps {
  preferences: AccountPrefs;
  onUpdate: (preferences: Partial<AccountPrefs>) => void;
  validationErrors?: Record<string, string>;
}

export function AccountSettings({ 
  preferences, 
  onUpdate, 
  validationErrors = {} 
}: AccountSettingsProps) {
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleInputChange = (field: keyof AccountPrefs, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleProfileChange = (field: keyof AccountPrefs['profile'], value: any) => {
    onUpdate({
      profile: {
        ...preferences.profile,
        [field]: value
      }
    });
  };

  const handleSecurityChange = (field: keyof AccountPrefs['security'], value: any) => {
    onUpdate({
      security: {
        ...preferences.security,
        [field]: value
      }
    });
  };

  const handleDataChange = (field: keyof AccountPrefs['data'], value: any) => {
    onUpdate({
      data: {
        ...preferences.data,
        [field]: value
      }
    });
  };

  const handlePrivacyChange = (field: keyof AccountPrefs['privacy'], value: any) => {
    onUpdate({
      privacy: {
        ...preferences.privacy,
        [field]: value
      }
    });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleProfileChange('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = () => {
    // This would integrate with your authentication system
    console.log('Password change requested');
    setIsChangingPassword(false);
  };

  const handleDataExport = () => {
    // This would trigger a full data export
    console.log('Data export requested');
  };

  const handleAccountDeletion = () => {
    if (showDeleteConfirm) {
      // This would trigger account deletion
      console.log('Account deletion confirmed');
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Hide confirmation after 10 seconds
      setTimeout(() => setShowDeleteConfirm(false), 10000);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sessionTimeoutOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '8 hours' },
  ];

  const dataRetentionOptions = [
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 24, label: '2 years' },
    { value: 60, label: '5 years' },
    { value: -1, label: 'Forever' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and profile settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={preferences.profile.avatar} />
                <AvatarFallback className="text-lg">
                  {preferences.profile.name ? getUserInitials(preferences.profile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 rounded-full h-8 w-8"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Upload a profile picture to personalize your account
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                {preferences.profile.avatar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProfileChange('avatar', undefined)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="profile-name"
                placeholder="Enter your full name"
                value={preferences.profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className={cn(validationErrors['profile.name'] && 'border-red-500')}
              />
              {validationErrors['profile.name'] && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors['profile.name']}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="profile-email"
                type="email"
                placeholder="your.email@example.com"
                value={preferences.profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className={cn(validationErrors['profile.email'] && 'border-red-500')}
              />
              {validationErrors['profile.email'] && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors['profile.email']}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">Bio (Optional)</Label>
            <Textarea
              id="profile-bio"
              placeholder="Tell us about your trading experience and goals..."
              value={preferences.profile.bio || ''}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              A brief description of yourself and your trading style
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Security & Authentication
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Change */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password
                </Label>
                <p className="text-sm text-muted-foreground">
                  Change your account password
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>

            {isChangingPassword && (
              <Card className="p-4 border-2 border-dashed">
                <div className="space-y-3">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                  <Input type="password" placeholder="Confirm new password" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePasswordChange}>
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsChangingPassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-sm font-normal flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Two-Factor Authentication
              </Label>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preferences.security.twoFactorEnabled && (
                <Badge variant="secondary" className="text-green-600">
                  Enabled
                </Badge>
              )}
              <Switch
                checked={preferences.security.twoFactorEnabled}
                onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
              />
            </div>
          </div>

          {/* Session Timeout */}
          <div className="space-y-2">
            <Label htmlFor="session-timeout" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Session Timeout
            </Label>
            <Select
              value={preferences.security.sessionTimeout.toString()}
              onValueChange={(value) => handleSecurityChange('sessionTimeout', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionTimeoutOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How long to keep you logged in when inactive
            </p>
          </div>

          {/* Login History */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-sm font-normal flex items-center gap-2">
                <History className="h-4 w-4" />
                Login History
              </Label>
              <p className="text-xs text-muted-foreground">
                Keep track of login attempts and sessions
              </p>
            </div>
            <Switch
              checked={preferences.security.loginHistory}
              onCheckedChange={(checked) => handleSecurityChange('loginHistory', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Control how your trading data is stored, backed up, and exported
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Backup */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-sm font-normal flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Automatic Backup
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically backup your data to prevent loss
              </p>
            </div>
            <Switch
              checked={preferences.data.autoBackup}
              onCheckedChange={(checked) => handleDataChange('autoBackup', checked)}
            />
          </div>

          {/* Backup Frequency */}
          {preferences.data.autoBackup && (
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Select
                value={preferences.data.backupFrequency}
                onValueChange={(value) => handleDataChange('backupFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Retention */}
          <div className="space-y-2">
            <Label htmlFor="data-retention">Data Retention Period</Label>
            <Select
              value={preferences.data.dataRetention.toString()}
              onValueChange={(value) => handleDataChange('dataRetention', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dataRetentionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How long to keep your trading data before automatic deletion
            </p>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="export-format" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Default Export Format
            </Label>
            <Select
              value={preferences.data.exportFormat}
              onValueChange={(value) => handleDataChange('exportFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma-separated values)</SelectItem>
                <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                <SelectItem value="excel">Excel (Microsoft Excel format)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Export */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-normal">Export All Data</Label>
              <p className="text-xs text-muted-foreground">
                Download a complete backup of your trading data
              </p>
            </div>
            <Button variant="outline" onClick={handleDataExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control what information is shared and how your data is used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-sm font-normal">Share Analytics Data</Label>
              <p className="text-xs text-muted-foreground">
                Help improve the platform by sharing anonymous usage data
              </p>
            </div>
            <Switch
              checked={preferences.privacy.shareAnalytics}
              onCheckedChange={(checked) => handlePrivacyChange('shareAnalytics', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-sm font-normal">Share Performance Data</Label>
              <p className="text-xs text-muted-foreground">
                Allow sharing of anonymized performance metrics for research
              </p>
            </div>
            <Switch
              checked={preferences.privacy.sharePerformance}
              onCheckedChange={(checked) => handlePrivacyChange('sharePerformance', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-sm font-normal">Allow Data Collection</Label>
              <p className="text-xs text-muted-foreground">
                Permit collection of usage data for product improvement
              </p>
            </div>
            <Switch
              checked={preferences.privacy.allowDataCollection}
              onCheckedChange={(checked) => handlePrivacyChange('allowDataCollection', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600">
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-normal text-red-700">Delete Account</Label>
              <p className="text-xs text-red-600">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant={showDeleteConfirm ? "destructive" : "outline"}
              onClick={handleAccountDeletion}
              className={cn(
                showDeleteConfirm && "animate-pulse"
              )}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete Account'}
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">
                    Are you absolutely sure?
                  </p>
                  <p className="text-xs text-red-700">
                    This action cannot be undone. This will permanently delete your account,
                    all your trading data, and remove all associated information from our servers.
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    Click "Confirm Delete" again within 10 seconds to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}