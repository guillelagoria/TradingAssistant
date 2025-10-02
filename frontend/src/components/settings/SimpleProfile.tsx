import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Key,
  Download,
  AlertTriangle,
  Save,
  Mail,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useTradeStore } from '@/store/tradeStore';

interface ProfileData {
  name: string;
  email: string;
  avatar?: string;
}

const DEFAULT_PROFILE: ProfileData = {
  name: '',
  email: '',
  avatar: undefined
};

export function SimpleProfile() {
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('user-profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const trades = useTradeStore((state) => state.trades);

  const handleChange = <K extends keyof ProfileData>(
    field: K,
    value: ProfileData[K]
  ) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleChange('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    handleChange('avatar', undefined);
  };

  const handleSave = () => {
    // Basic validation
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!profile.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    localStorage.setItem('user-profile', JSON.stringify(profile));
    setHasChanges(false);
    toast.success('Profile saved successfully');
  };

  const handlePasswordChange = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // In a real app, this would call the backend
    toast.success('Password changed successfully');
    setShowPasswordDialog(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleExportTrades = () => {
    if (trades.length === 0) {
      toast.error('No trades to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Symbol', 'Direction', 'Entry Price', 'Exit Price', 'Quantity', 'P&L', 'Commission', 'Notes'];
    const rows = trades.map(trade => [
      new Date(trade.entryDate).toLocaleDateString(),
      trade.symbol,
      trade.direction,
      trade.entryPrice,
      trade.exitPrice || '',
      trade.quantity,
      trade.pnl?.toFixed(2) || '',
      trade.commission || '',
      trade.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading-diary-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${trades.length} trades to CSV`);
  };

  const handleDeleteAccount = () => {
    // Clear all data
    localStorage.clear();

    toast.success('Account deleted. Page will reload...');

    // Reload page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal information for the trading diary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-lg">
                  {getUserInitials(profile.name)}
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
              <h3 className="text-sm font-medium">Profile Picture</h3>
              <p className="text-xs text-muted-foreground">
                Upload a photo to personalize your account
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                {profile.avatar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
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
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                placeholder="Enter your name"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                type="email"
                placeholder="your.email@example.com"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              onClick={() => setShowPasswordDialog(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your trading data or manage your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Export Trades</Label>
              <p className="text-sm text-muted-foreground">
                Download all your trades as CSV file
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportTrades}
              disabled={trades.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-red-700 dark:text-red-400">
                Delete Account
              </Label>
              <p className="text-xs text-red-600 dark:text-red-400">
                Permanently delete all your data and account information
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your trading data.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You will lose all your trades, accounts, and settings. Make sure to export
              your data before proceeding.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Yes, Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
