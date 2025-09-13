import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { Trade, ExportOptions, ExportProgress as ExportProgressType } from '../../types';
import ExportOptionsComponent from './ExportOptions';
import ExportProgress from './ExportProgress';
import { CsvExporter } from '../../utils/csvExport';
import { PdfExporter, PdfExportOptions } from '../../utils/pdfExport';

interface ExportDialogProps {
  trades: Trade[];
  trigger?: React.ReactNode;
  chartElements?: HTMLElement[];
  defaultOptions?: Partial<ExportOptions>;
  onExportComplete?: (success: boolean, fileName?: string) => void;
  onExportStart?: () => void;
}

type ExportState = 'options' | 'progress' | 'complete';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  trades,
  trigger,
  chartElements = [],
  defaultOptions = {},
  onExportComplete,
  onExportStart
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportState, setExportState] = useState<ExportState>('options');
  const [progress, setProgress] = useState<ExportProgressType>({
    stage: 'preparing',
    progress: 0,
    message: 'Initializing...'
  });
  const [currentExporter, setCurrentExporter] = useState<CsvExporter | PdfExporter | null>(null);

  const handleExport = async (options: ExportOptions) => {
    setExportState('progress');
    setProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Initializing export...'
    });

    onExportStart?.();

    try {
      let exporter: CsvExporter | PdfExporter;
      let result: any;

      if (options.format === 'csv') {
        exporter = new CsvExporter();
        setCurrentExporter(exporter);
        
        exporter.onProgress((progressUpdate) => {
          setProgress(progressUpdate);
        });

        result = await exporter.exportTrades(trades, options);
      } else {
        exporter = new PdfExporter();
        setCurrentExporter(exporter);
        
        exporter.onProgress((progressUpdate) => {
          setProgress(progressUpdate);
        });

        const pdfOptions: PdfExportOptions = {
          ...options,
          includeCharts: chartElements.length > 0,
          chartElements: chartElements.length > 0 ? chartElements : undefined,
          pageOrientation: 'portrait',
          includeHeader: true,
          includeFooter: true,
          reportTitle: 'Trading Performance Report'
        };

        result = await exporter.exportTradesReport(trades, pdfOptions);
      }

      if (result.success) {
        setExportState('complete');
        onExportComplete?.(true, result.fileName);
      } else {
        setProgress({
          stage: 'error',
          progress: 0,
          message: 'Export failed',
          error: result.error
        });
        onExportComplete?.(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage
      });
      onExportComplete?.(false);
    } finally {
      setCurrentExporter(null);
    }
  };

  const handleCancel = () => {
    if (currentExporter) {
      currentExporter.cancel();
    }
    setExportState('options');
    setCurrentExporter(null);
  };

  const handleClose = () => {
    if (currentExporter) {
      currentExporter.cancel();
    }
    setIsOpen(false);
    setExportState('options');
    setCurrentExporter(null);
    setProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Initializing...'
    });
  };

  const handleDialogCancel = () => {
    if (exportState === 'progress' && currentExporter) {
      // If export is in progress, cancel it first
      handleCancel();
    } else {
      // Otherwise just close the dialog
      handleClose();
    }
  };

  const renderContent = () => {
    switch (exportState) {
      case 'options':
        return (
          <ExportOptionsComponent
            trades={trades}
            onExport={handleExport}
            onCancel={handleDialogCancel}
            isExporting={false}
          />
        );
      
      case 'progress':
      case 'complete':
        return (
          <ExportProgress
            progress={progress}
            onCancel={exportState === 'progress' ? handleCancel : undefined}
            onClose={exportState === 'complete' ? handleClose : undefined}
            showCloseButton={exportState === 'complete'}
          />
        );
      
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (exportState) {
      case 'options':
        return 'Export Trades';
      case 'progress':
        return 'Exporting Data';
      case 'complete':
        return 'Export Complete';
      default:
        return 'Export Trades';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="h-8">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;