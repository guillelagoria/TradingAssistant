import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Settings,
  BarChart3,
  Zap,
  Clock,
  Target,
  X
} from 'lucide-react';

interface ImportStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  canProceed: boolean;
  isOptional?: boolean;
}

interface GuidedNT8ImportProps {
  onClose: () => void;
  onComplete: (file: File) => void;
}

const GuidedNT8Import: React.FC<GuidedNT8ImportProps> = ({
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportSettings, setExportSettings] = useState({
    includeMAE: true,
    includeMFE: true,
    includeTiming: true,
    includeStrategy: true
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
    }
  };

  const steps: ImportStep[] = [
    {
      id: 'intro',
      title: 'Welcome to NT8 Import',
      description: 'Let\'s unlock advanced analytics with your NinjaTrader 8 data',
      icon: <Upload className="w-6 h-6" />,
      canProceed: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Supercharge Your Analytics</h3>
            <p className="text-muted-foreground">
              Import your NT8 trade data to unlock advanced metrics like MAE/MFE analysis,
              timing insights, and strategy performance breakdowns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium">MAE/MFE Analysis</div>
              <div className="text-xs text-muted-foreground">Entry/exit timing optimization</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">Duration Insights</div>
              <div className="text-xs text-muted-foreground">Trade timing patterns</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium">Strategy Breakdown</div>
              <div className="text-xs text-muted-foreground">Performance by strategy</div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-800">Before You Start</div>
                <div className="text-sm text-yellow-700">
                  Make sure you've exported your trade data from NinjaTrader 8 as a CSV file
                  with all available fields selected.
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'export-guide',
      title: 'Export from NinjaTrader 8',
      description: 'Step-by-step guide to export your trade data',
      icon: <Settings className="w-6 h-6" />,
      canProceed: true,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-medium">Open Trade Performance</div>
                <div className="text-sm text-muted-foreground">
                  In NT8, go to Tools → Trade Performance
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-medium">Select Date Range</div>
                <div className="text-sm text-muted-foreground">
                  Choose the period you want to analyze
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-medium">Right-click → Export</div>
                <div className="text-sm text-muted-foreground">
                  Right-click on the trade grid and select "Export"
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                4
              </div>
              <div>
                <div className="font-medium">Select All Fields</div>
                <div className="text-sm text-muted-foreground">
                  Make sure to include MAE, MFE, ETD, Bars, and Strategy fields
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                5
              </div>
              <div>
                <div className="font-medium">Save as CSV</div>
                <div className="text-sm text-muted-foreground">
                  Export to CSV format and save to your computer
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Download className="w-5 h-5 text-blue-600" />
              <div className="font-medium text-blue-900">Pro Tip</div>
            </div>
            <div className="text-sm text-blue-800">
              Include all available columns in your export. We'll automatically detect
              which advanced metrics are available and adapt your analytics accordingly.
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">Expected File Format:</div>
            <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
              Trade number;Instrument;Account;Strategy;Market pos.;Qty;Entry price;Exit price;
              Entry time;Exit time;Entry name;Exit name;Profit;Cum. net profit;Commission;
              MAE;MFE;ETD;Bars;
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'file-upload',
      title: 'Upload Your CSV File',
      description: 'Select the exported CSV file from your computer',
      icon: <FileText className="w-6 h-6" />,
      canProceed: !!selectedFile,
      content: (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <div className="text-lg font-medium">Drop your CSV file here</div>
              <div className="text-sm text-muted-foreground">or click to browse</div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="mt-4"
              >
                Choose File
              </Button>
            </div>
          </div>

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">{selectedFile.name}</div>
                  <div className="text-sm text-green-700">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to import
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <div className="font-medium">What we'll detect automatically:</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Basic trade data</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>P&L and commission</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>MAE/MFE (if available)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Duration data (if available)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Strategy info (if available)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>Entry/exit signals (if available)</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'preview',
      title: 'Preview & Confirm',
      description: 'Review the import settings before processing',
      icon: <CheckCircle className="w-6 h-6" />,
      canProceed: true,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="font-medium text-blue-900">File Ready for Import</div>
            </div>
            <div className="text-sm text-blue-800">
              {selectedFile?.name} • {selectedFile ? (selectedFile.size / 1024).toFixed(1) : '0'} KB
            </div>
          </div>

          <div className="space-y-4">
            <div className="font-medium">Import will unlock:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    <Zap className="w-3 h-3 mr-1" />
                    MAE/MFE Analysis
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Duration Insights
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-purple-100 text-purple-700">
                    <Target className="w-3 h-3 mr-1" />
                    Strategy Breakdown
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-orange-100 text-orange-700">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Advanced Metrics
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-800">Import Notes</div>
                <div className="text-sm text-yellow-700">
                  • Existing trades won't be duplicated
                  <br />
                  • Import will enhance your current data with advanced fields
                  <br />
                  • You can import additional files later to add more data
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (selectedFile) {
      onComplete(selectedFile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {currentStepData.icon}
                </div>
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.content}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!currentStepData.canProceed}
                  className="flex items-center space-x-2"
                >
                  <span>{currentStep === steps.length - 1 ? 'Import Data' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default GuidedNT8Import;