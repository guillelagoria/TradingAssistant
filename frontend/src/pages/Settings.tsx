import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Wallet,
  Bell,
  Palette,
  TrendingUp,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Settings components
import {
  UserSettings,
  TradingPreferences,
  DisplayPreferences,
  AccountSettings,
  NotificationSettings
} from '@/components/settings';

// New component for trading account management
import TradingAccountManager from '@/components/settings/TradingAccountManager';

// Mock user preferences (in real app this would come from store/API)
const mockUserPreferences = {
  profile: {
    name: 'John Trader',
    email: 'john.trader@example.com',
    bio: 'Professional day trader with 5+ years experience',
    avatar: undefined
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginHistory: true
  },
  data: {
    autoBackup: true,
    backupFrequency: 'daily' as const,
    dataRetention: 24,
    exportFormat: 'csv' as const
  },
  privacy: {
    shareAnalytics: true,
    sharePerformance: false,
    allowDataCollection: true
  }
};

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userPreferences, setUserPreferences] = useState(mockUserPreferences);
  const [activeTab, setActiveTab] = useState('accounts');

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['accounts', 'user', 'trading', 'display', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleUserPreferencesUpdate = (updates: Partial<typeof mockUserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...updates }));
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const settingsTabs = [
    {
      id: 'accounts',
      label: 'Trading Accounts',
      icon: Wallet,
      description: 'Manage your trading accounts',
      badge: 'New'
    },
    {
      id: 'user',
      label: 'User Profile',
      icon: User,
      description: 'Personal information and security'
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: TrendingUp,
      description: 'Trading preferences and defaults'
    },
    {
      id: 'display',
      label: 'Display',
      icon: Palette,
      description: 'Theme and display preferences'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alert and notification settings'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and trading configuration
            </p>
          </div>
        </div>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Tab Navigation */}
          <Card>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-2">
                {settingsTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {tab.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>
          </Card>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Trading Accounts */}
            <TabsContent value="accounts" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Trading Account Management
                    </CardTitle>
                    <CardDescription>
                      Create and manage your trading accounts. Switch between Demo and Live accounts
                      to track your trading performance across different environments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TradingAccountManager />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* User Profile */}
            <TabsContent value="user" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AccountSettings
                  preferences={userPreferences}
                  onUpdate={handleUserPreferencesUpdate}
                />
              </motion.div>
            </TabsContent>

            {/* Trading Preferences */}
            <TabsContent value="trading" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TradingPreferences />
              </motion.div>
            </TabsContent>

            {/* Display Preferences */}
            <TabsContent value="display" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DisplayPreferences />
              </motion.div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <NotificationSettings />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Need Help?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  If you need assistance with any settings or have questions about account management,
                  check our documentation or contact support.
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                    View Documentation
                  </button>
                  <button className="text-xs border border-blue-600 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;