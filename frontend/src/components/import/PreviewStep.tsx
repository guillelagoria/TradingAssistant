import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useImportStore } from '@/store/importStore';
import { importService } from '@/services/importService';
import type { NT8Trade, ImportError } from '@/types/import';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PreviewStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function PreviewStep({ onNext, onPrevious }: PreviewStepProps) {
  const {
    currentSession,
    previewData,
    options,
    isProcessing,
    error,
    setPreviewData,
    setIsProcessing,
    setError,
    setOptions,
    nextWizardStep,
  } = useImportStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentSession && !previewData) {
      loadPreview();
    }
  }, [currentSession]);

  const loadPreview = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    setIsProcessing(true);

    try {
      const response = await importService.previewImport(currentSession.id, options);
      setPreviewData(response.preview);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    nextWizardStep();
    onNext();
  };

  const handleOptionsChange = (key: keyof typeof options, value: any) => {
    setOptions({ [key]: value });
    // Reload preview with new options
    loadPreview();
  };

  if (isLoading || !previewData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Processing File</h2>
          <p className="text-muted-foreground mt-2">
            Analyzing your NT8 data...
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <BarChart3 className="h-12 w-12 text-blue-500" />
              </motion.div>
              <div className="text-center space-y-2">
                <p className="font-medium">Processing your trading data</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments...
                </p>
              </div>
              <Progress value={undefined} className="w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Records',
      value: previewData?.totalRecords || 0,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Valid Records',
      value: previewData?.validRecords || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Invalid Records',
      value: previewData?.invalidRecords || 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Duplicates',
      value: previewData?.duplicateRecords || 0,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Preview Import Data</h2>
        <p className="text-muted-foreground mt-2">
          Review your trading data before importing
        </p>
      </div>

      {/* Import Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Import Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="skip-duplicates" className="text-sm">
                Skip duplicate trades
              </Label>
              <Switch
                id="skip-duplicates"
                checked={options.skipDuplicates}
                onCheckedChange={(checked) => handleOptionsChange('skipDuplicates', checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="validate-data" className="text-sm">
                Validate data integrity
              </Label>
              <Switch
                id="validate-data"
                checked={options.validateData}
                onCheckedChange={(checked) => handleOptionsChange('validateData', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Data Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trades">Sample Trades</TabsTrigger>
              <TabsTrigger value="errors">
                Errors ({previewData?.errors?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings ({previewData?.warnings?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="space-y-4">
              <ScrollArea className="h-96 w-full">
                <div className="space-y-2">
                  {(previewData?.trades || []).slice(0, 10).map((trade, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                          <div>
                            <p className="font-medium">{trade.instrument}</p>
                            <p className="text-muted-foreground">{trade.account}</p>
                          </div>
                          <div>
                            <p className="font-medium">{trade.quantity > 0 ? 'LONG' : 'SHORT'}</p>
                            <p className="text-muted-foreground">
                              {Math.abs(trade.quantity)} contracts
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">${trade.price}</p>
                            <p className="text-muted-foreground">Entry Price</p>
                          </div>
                          <div>
                            <p className="font-medium">
                              {trade.time ? (() => {
                                const date = new Date(trade.time);
                                return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'MM/dd/yyyy');
                              })() : 'No Date'}
                            </p>
                            <p className="text-muted-foreground">
                              {trade.time ? (() => {
                                const date = new Date(trade.time);
                                return isNaN(date.getTime()) ? 'Invalid Time' : format(date, 'HH:mm:ss');
                              })() : 'No Time'}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">${trade.commission}</p>
                            <p className="text-muted-foreground">Commission</p>
                          </div>
                          <div className="flex items-center">
                            {trade.error === 'Duplicate trade' ? (
                              <Badge variant="outline">Duplicate</Badge>
                            ) : trade.error ? (
                              <Badge variant="destructive">Error</Badge>
                            ) : (
                              <Badge variant="default">Valid</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  {previewData.trades.length > 10 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      ... and {previewData.trades.length - 10} more trades
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              <ScrollArea className="h-96 w-full">
                {previewData.errors.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No errors found!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {previewData.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Row {error.row}:</strong> {error.message}
                          {error.field && <span className="text-xs"> (Field: {error.field})</span>}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="warnings" className="space-y-4">
              <ScrollArea className="h-96 w-full">
                {previewData.warnings.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No warnings!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {previewData.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Row {warning.row}:</strong> {warning.message}
                          {warning.field && <span className="text-xs"> (Field: {warning.field})</span>}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button
          onClick={handleImport}
          disabled={previewData.validRecords === 0}
          className="min-w-[120px]"
        >
          {previewData.validRecords === 0
            ? 'No New Trades to Import'
            : `Import ${previewData.validRecords} Trades`
          }
        </Button>
      </div>
    </div>
  );
}