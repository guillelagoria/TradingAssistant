import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Monitor, 
  User, 
  Bell, 
  RotateCcw, 
  Download, 
  Upload,
  Save,
  AlertTriangle 
} from 'lucide-react';

import { TradingPreferences } from './TradingPreferences';
import { DisplayPreferences } from './DisplayPreferences';
import { AccountSettings } from './AccountSettings';
import { NotificationSettings } from './NotificationSettings';

import { SETTINGS_CATEGORIES, type SettingsCategoryId } from '@/types/user';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

interface UserSettingsProps {
  className?: string;
}

export function UserSettings({ className }: UserSettingsProps) {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    exportSettings,
    importSettings,
    isDirty,
    saveSettings,
    validationErrors
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsCategoryId>('trading');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!isDirty) return;
    
    setIsLoading(true);
    try {
      await saveSettings();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await resetPreferences();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportSettings();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-diary-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      await importSettings(settings);
    } catch (error) {
      console.error('Failed to import settings:', error);
      alert('Failed to import settings. Please check the file format.');
    }
  };

  const getTabIcon = (categoryId: SettingsCategoryId) => {
    const iconMap = {
      trading: TrendingUp,
      display: Monitor,
      account: User,
      notifications: Bell,
    };
    
    const Icon = iconMap[categoryId];
    return <Icon className="h-4 w-4" />;
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your trading preferences and account settings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unsaved changes
            </Badge>
          )}
          
          {hasValidationErrors && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {Object.keys(validationErrors).length} error(s)
            </Badge>
          )}
          
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-settings"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-settings')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!isDirty || hasValidationErrors || isLoading}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsCategoryId)}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(SETTINGS_CATEGORIES).map(([key, category]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className="flex items-center gap-2"
            >
              {getTabIcon(key as SettingsCategoryId)}
              <span className="hidden sm:inline">{category.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Trading Preferences Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Preferences
              </CardTitle>
              <CardDescription>
                Configure default trading parameters, risk management, and calculation settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradingPreferences
                preferences={preferences.trading}
                onUpdate={(trading) => updatePreferences({ trading })}
                validationErrors={validationErrors.trading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Preferences Tab */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Display & Interface
              </CardTitle>
              <CardDescription>
                Customize the appearance and layout of your trading dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisplayPreferences
                preferences={preferences.display}
                onUpdate={(display) => updatePreferences({ display })}
                validationErrors={validationErrors.display}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your profile, security, and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSettings
                preferences={preferences.account}
                onUpdate={(account) => updatePreferences({ account })}
                validationErrors={validationErrors.account}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure alerts, reports, and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings
                preferences={preferences.notifications}
                onUpdate={(notifications) => updatePreferences({ notifications })}
                validationErrors={validationErrors.notifications}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Errors Summary */}
      {hasValidationErrors && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
            <CardDescription className="text-red-600">
              Please fix the following errors before saving your settings:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {Object.entries(validationErrors).map(([category, errors]) =>
                Object.entries(errors || {}).map(([field, error]) => (
                  <li key={`${category}.${field}`}>
                    <strong>{SETTINGS_CATEGORIES[category as SettingsCategoryId]?.title}</strong>: {error}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          Settings are automatically saved locally and synced when connected.
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last saved: {preferences ? 'Just now' : 'Never'}
          </span>
          <div className={cn(
            'h-2 w-2 rounded-full',
            isDirty ? 'bg-orange-500' : 'bg-green-500'
          )} />
        </div>
      </div>
    </div>
  );
}