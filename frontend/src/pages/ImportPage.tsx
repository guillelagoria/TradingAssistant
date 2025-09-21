import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  History,
  FileText,
  TrendingUp,
  Download,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportWizard, ImportHistory } from '@/components/import';
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

  const features = [
    {
      icon: Upload,
      title: 'Easy File Upload',
      description: 'Drag & drop your NT8 export files for quick processing',
    },
    {
      icon: FileText,
      title: 'Data Validation',
      description: 'Automatic validation and error detection before import',
    },
    {
      icon: TrendingUp,
      title: 'Smart Processing',
      description: 'Intelligent trade matching and duplicate detection',
    },
    {
      icon: History,
      title: 'Import History',
      description: 'Track all your imports with detailed session logs',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Import NT8 Data
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Import your NinjaTrader 8 trading data seamlessly
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">
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
                    <span>New Import</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>Import History</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="import" className="space-y-6">
                  <ImportWizard onComplete={handleImportComplete} />
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <ImportHistory />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Getting Your NT8 Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Export from NinjaTrader 8</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Open NinjaTrader 8 Control Center</li>
                    <li>Navigate to Tools → Trade Performance</li>
                    <li>Select your account and date range</li>
                    <li>Click the "Export" button</li>
                    <li>Save as CSV or TXT format</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Supported File Formats</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• CSV files (.csv)</li>
                    <li>• Text files (.txt)</li>
                    <li>• Excel files (.xls, .xlsx)</li>
                    <li>• Maximum file size: 50MB</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Need help?</p>
                    <p className="text-sm text-muted-foreground">
                      Check our documentation for detailed instructions
                    </p>
                  </div>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Docs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}