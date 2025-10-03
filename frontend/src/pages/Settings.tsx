import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Wallet,
  Sliders
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Simplified components
import TradingAccountManager from '@/components/settings/TradingAccountManager';
import { SimplePreferences } from '@/components/settings/SimplePreferences';
import { SimpleProfile } from '@/components/settings/SimpleProfile';

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('accounts');

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['accounts', 'preferences', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const settingsTabs = [
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Wallet,
      description: 'Manage your trading accounts'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: Sliders,
      description: 'Trading defaults and display settings'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Personal information and security'
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <SettingsIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your trading diary preferences and account
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          {/* Tab Navigation */}
          <Card>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-3 gap-2 h-auto p-2">
                {settingsTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>
          </Card>

          {/* Tab Content */}
          <div className="space-y-6 pt-2">
            {/* Trading Accounts */}
            <TabsContent value="accounts" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      <div>
                        <h2 className="text-lg font-semibold">Trading Accounts</h2>
                        <p className="text-sm text-muted-foreground">
                          Create and manage your trading accounts. Switch between Demo and Live accounts
                          to track your trading performance.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                <TradingAccountManager />
              </motion.div>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SimplePreferences />
              </motion.div>
            </TabsContent>

            {/* Profile */}
            <TabsContent value="profile" className="space-y-6 mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SimpleProfile />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Settings;
