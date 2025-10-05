import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  History,
  Download,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportHistory, ImportWizardV2 } from '@/components/import';
import { useImportStore } from '@/store/importStore';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';

export function ImportPage() {
  const navigate = useNavigate();
  const { resetImport } = useImportStore();
  const { refreshTradesForAccount } = useTradeStore();
  const activeAccount = useActiveAccount();
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');

  const handleImportComplete = async () => {
    // Refresh trades for the active account to reflect imported data
    if (activeAccount) {
      await refreshTradesForAccount(activeAccount.id);
    }

    // Navigate to dashboard after successful import
    navigate('/');
  };

  const handleBackToDashboard = () => {
    resetImport();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Upload className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Import NT8 Data
              </h1>
              <p className="text-xl text-muted-foreground dark:text-gray-400 mt-2">
                Import your NinjaTrader 8 trading data seamlessly
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl dark:shadow-blue-900/10">
            <CardHeader>
              <CardTitle className="text-center dark:text-gray-100">
                Import & History Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'import' | 'history')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="import" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Import NT8 Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>Import History</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="import" className="space-y-6">
                  <ImportWizardV2 onComplete={handleImportComplete} />
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <ImportHistory />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section - Improved NT8 Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="dark:border-blue-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>How to Export from NinjaTrader 8</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Step-by-step instructions */}
              <div>
                <h4 className="font-semibold mb-4 text-lg dark:text-gray-200">📋 Step-by-Step Guide</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-gray-200">Open NinjaTrader 8 Control Center</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                        Launch the main NT8 application and ensure you're logged into your account
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-gray-200">Navigate to Trade Performance</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                        Click <strong className="text-blue-600 dark:text-blue-400">Tools</strong> → <strong className="text-blue-600 dark:text-blue-400">Trade Performance</strong> from the top menu
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-gray-200">Configure Export Settings</p>
                      <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1 space-y-1">
                        <p>• Select your <strong className="text-blue-600 dark:text-blue-400">Account</strong> from the dropdown</p>
                        <p>• Set <strong className="text-blue-600 dark:text-blue-400">Date Range</strong> (From/To dates)</p>
                        <p>• Choose <strong className="text-blue-600 dark:text-blue-400">Strategy</strong> if applicable (or "All")</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      4
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-gray-200">Right-click on the grid</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                        Right-click anywhere on the trades grid and select <strong className="text-blue-600 dark:text-blue-400">"Export..."</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      5
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-gray-200">Save the CSV file</p>
                      <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1 space-y-1">
                        <p>• Choose a location to save the file</p>
                        <p>• Ensure format is <strong className="text-blue-600 dark:text-blue-400">CSV (Comma delimited)</strong></p>
                        <p>• Click <strong className="text-blue-600 dark:text-blue-400">Save</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-600 dark:text-green-400">Ready to Import!</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                        Use the "Import V2" tab above to upload your exported CSV file
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick reference */}
              <div className="pt-4 border-t dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h5 className="font-semibold text-sm mb-2 dark:text-gray-200">✅ Supported Formats</h5>
                    <ul className="space-y-1 text-xs text-muted-foreground dark:text-gray-400">
                      <li>• CSV files (.csv) - Recommended</li>
                      <li>• Text files (.txt)</li>
                      <li>• Maximum file size: 50MB</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <h5 className="font-semibold text-sm mb-2 dark:text-gray-200">💡 Pro Tips</h5>
                    <ul className="space-y-1 text-xs text-muted-foreground dark:text-gray-400">
                      <li>• Export small batches for faster processing</li>
                      <li>• Check for duplicates before importing</li>
                      <li>• MAE/MFE data is automatically extracted</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}