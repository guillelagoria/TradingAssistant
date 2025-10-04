/**
 * ImportWizardV2 Component
 * Modern NT8 import wizard with 3 simple steps
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useActiveAccount } from '@/store/accountStore';
import { UploadStep } from './UploadStep';
import { PreviewStep } from './PreviewStep';
import { ResultStep } from './ResultStep';
import { previewNT8Import, executeNT8Import } from '@/services/nt8ImportV2.service';
import type { NT8PreviewResponse, NT8ExecuteResponse } from '@/types/import';

type WizardStep = 'upload' | 'preview' | 'result';

interface ImportWizardV2Props {
  onComplete?: () => void;
}

export function ImportWizardV2({ onComplete }: ImportWizardV2Props) {
  const navigate = useNavigate();
  const activeAccount = useActiveAccount();

  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<NT8PreviewResponse['data'] | null>(null);
  const [resultData, setResultData] = useState<NT8ExecuteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle file selection and preview
  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!activeAccount) {
        toast.error('No Active Account', {
          description: 'Please select a trading account first.',
        });
        return;
      }

      setSelectedFile(file);
      setIsLoading(true);

      try {
        console.log('[ImportWizard] Starting preview for file:', file.name, 'Account:', activeAccount.id);
        const response = await previewNT8Import(file, activeAccount.id);
        console.log('[ImportWizard] Preview response:', response);

        if (response.success && response.data) {
          setPreviewData(response.data);
          setCurrentStep('preview');
        } else {
          console.error('[ImportWizard] Preview failed - success flag false:', response);
          toast.error('Preview Failed', {
            description: response.message || 'Failed to preview import file.',
          });
        }
      } catch (error: any) {
        console.error('[ImportWizard] Preview error - exception caught:', error);
        console.error('[ImportWizard] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error('Preview Error', {
          description: error.response?.data?.message || error.message || 'Failed to preview file.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [activeAccount]
  );

  // Handle import execution
  const handleImport = useCallback(async () => {
    if (!selectedFile || !activeAccount) return;

    setIsLoading(true);

    try {
      const response = await executeNT8Import(selectedFile, activeAccount.id);

      setResultData(response);
      setCurrentStep('result');

      if (response.success && response.data.imported > 0) {
        toast.success('Import Successful', {
          description: `${response.data.imported} trade${response.data.imported !== 1 ? 's' : ''} imported successfully.`,
        });

        // Call onComplete if provided
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Import Error', {
        description: error.response?.data?.message || error.message || 'Failed to import trades.',
      });
      
      // Set error result
      setResultData({
        success: false,
        data: {
          imported: 0,
          skipped: 0,
          errors: previewData?.totalTrades || 0,
          message: 'Import failed',
        },
      });
      setCurrentStep('result');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, activeAccount, previewData, onComplete]);

  // Handle cancel/reset
  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreviewData(null);
    setCurrentStep('upload');
  }, []);

  // Handle view trades navigation
  const handleViewTrades = useCallback(() => {
    navigate('/trades');
  }, [navigate]);

  // Handle import more
  const handleImportMore = useCallback(() => {
    setSelectedFile(null);
    setPreviewData(null);
    setResultData(null);
    setCurrentStep('upload');
  }, []);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <UploadStep onFileSelected={handleFileSelected} isLoading={isLoading} />
          </motion.div>
        )}

        {/* Step 2: Preview */}
        {currentStep === 'preview' && previewData && selectedFile && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <PreviewStep
              fileName={selectedFile.name}
              previewData={previewData}
              onImport={handleImport}
              onCancel={handleCancel}
              isImporting={isLoading}
            />
          </motion.div>
        )}

        {/* Step 3: Result */}
        {currentStep === 'result' && resultData && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <ResultStep
              result={resultData}
              onViewTrades={handleViewTrades}
              onImportMore={handleImportMore}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
