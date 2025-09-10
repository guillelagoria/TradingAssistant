# Trading Diary - Export System

A comprehensive export system that allows users to export their trading data and reports in multiple formats with advanced filtering and customization options.

## 📁 File Structure

```
src/
├── components/export/
│   ├── ExportDialog.tsx      # Main export modal with state management
│   ├── ExportOptions.tsx     # Format selection and filtering options  
│   ├── ExportProgress.tsx    # Progress indicator with cancellation
│   ├── ExportDemo.tsx        # Demo component with sample data
│   └── index.ts              # Export barrel file
├── utils/
│   ├── exportHelpers.ts      # Common utilities and helpers
│   ├── csvExport.ts          # CSV export functionality
│   └── pdfExport.ts          # PDF export with charts
└── types/index.ts            # Export type definitions
```

## 🚀 Features

### CSV Export
- **Complete Data Export**: All trade columns with proper formatting
- **Statistics Integration**: Trading performance metrics included
- **Custom Column Selection**: Choose which fields to export
- **Advanced Filtering**: Date ranges, symbols, strategies, results
- **Batch Processing**: Handles large datasets efficiently
- **Progress Tracking**: Real-time progress with cancellation support

### PDF Export
- **Professional Reports**: Clean, formatted trading reports
- **Chart Integration**: Automatic chart capture and embedding
- **Multi-page Support**: Handles large datasets across multiple pages
- **Custom Headers/Footers**: Branded report layout
- **Performance Summary**: Key metrics and statistics
- **Trade History Tables**: Formatted trade data tables

### User Interface
- **Intuitive Modal**: Step-by-step export configuration
- **Format Selection**: Radio buttons for CSV/PDF choice
- **Filter Options**: Date pickers, multi-select filters
- **Progress Feedback**: Visual progress bars with status messages
- **Error Handling**: Graceful error display and recovery
- **Responsive Design**: Works on desktop and mobile

## 📊 Dependencies Added

```json
{
  "jspdf": "^3.0.2",
  "html2canvas": "^1.4.1", 
  "csv-parse": "^6.1.0",
  "csv-stringify": "^6.6.0",
  "@radix-ui/react-popover": "^1.1.15",
  "@radix-ui/react-radio-group": "^1.3.8",
  "react-day-picker": "^9.9.0"
}
```

## 🔧 Usage Examples

### Basic Trade Table Export
```tsx
import { ExportDialog } from '@/components/export';

// In TradeTable component
<ExportDialog 
  trades={trades}
  trigger={
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  }
/>
```

### Dashboard Report Export
```tsx
// Dashboard with charts
<ExportDialog
  trades={trades}
  chartElements={getChartElements()}
  defaultOptions={{
    includeStats: true,
    includeCharts: true
  }}
  trigger={
    <Button variant="outline">
      <FileBarChart className="h-4 w-4 mr-2" />
      Export Report
    </Button>
  }
/>
```

### Custom Export Options
```tsx
<ExportDialog
  trades={trades}
  defaultOptions={{
    format: 'csv',
    fileName: 'my-trades',
    includeStats: true,
    dateRange: {
      from: startDate,
      to: endDate
    },
    filters: {
      symbols: ['AAPL', 'TSLA'],
      strategies: [Strategy.DAY_TRADING]
    }
  }}
/>
```

### Programmatic Export
```tsx
import { CsvExporter, PdfExporter } from '@/utils';

// CSV Export
const csvExporter = new CsvExporter();
csvExporter.onProgress(handleProgress);
const result = await csvExporter.exportTrades(trades, options);

// PDF Export
const pdfExporter = new PdfExporter();
pdfExporter.onProgress(handleProgress);
const result = await pdfExporter.exportTradesReport(trades, options);
```

## ⚙️ Configuration Options

### ExportOptions Interface
```typescript
interface ExportOptions {
  format: 'csv' | 'pdf';
  fileName?: string;
  includeStats?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: {
    symbols?: string[];
    directions?: TradeDirection[];
    results?: TradeResult[];
    strategies?: Strategy[];
    timeframes?: Timeframe[];
  };
  columns?: (keyof Trade)[];
}
```

### PDF-Specific Options
```typescript
interface PdfExportOptions extends ExportOptions {
  includeCharts?: boolean;
  chartElements?: HTMLElement[];
  pageOrientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyName?: string;
  reportTitle?: string;
}
```

## 📈 Progress Tracking

The export system provides real-time progress feedback:

```typescript
interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}
```

### Progress Stages
1. **Preparing**: Initializing export and filtering data
2. **Processing**: Processing trades in batches
3. **Generating**: Creating the final file
4. **Complete**: Export successful, file downloaded
5. **Error**: Export failed with error details

## 🎯 Integration Points

### TradeTable Component
- Export button in table header (desktop)
- Export option in mobile card view
- Exports filtered/sorted trades
- Configurable visibility with `showExport` prop

### Dashboard Component
- Export report button with charts
- Quick CSV export option
- Chart elements automatically captured
- Comprehensive performance report

### What-If Analysis
- Export analysis results
- CSV format with trade data
- Analysis insights included

## 🔒 Error Handling

- **Network Errors**: Graceful fallback and retry options
- **Large Datasets**: Chunked processing to prevent timeouts
- **Memory Management**: Efficient handling of large data sets
- **User Cancellation**: Clean cancellation with proper cleanup
- **File Generation Errors**: Detailed error messages and recovery

## 🎨 Styling & Theming

- **Consistent Design**: Uses shadcn/ui components
- **Dark Mode Support**: Automatic theme adaptation  
- **Responsive Layout**: Mobile-first design approach
- **Professional PDF**: Clean, branded report layout
- **Progress Indicators**: Visual feedback throughout process

## 🧪 Testing

### Demo Component
Use the `ExportDemo` component to test all export functionality:

```tsx
import { ExportDemo } from '@/components/export';

// Renders a comprehensive demo with sample data
<ExportDemo />
```

### Sample Data
The demo includes realistic trade data:
- 3 sample trades with different outcomes
- Multiple strategies and timeframes
- Realistic P&L and metrics
- Complete trade lifecycle data

## 🚀 Performance Considerations

- **Batch Processing**: Handles large datasets in chunks
- **Memory Efficient**: Streaming approach for large exports
- **Cancel Support**: User can cancel long-running exports
- **Progress Updates**: Non-blocking UI updates during export
- **Chart Optimization**: High-quality chart capture without UI freezing

## 🔮 Future Enhancements

- **Email Export**: Send reports via email
- **Cloud Storage**: Save to Google Drive, Dropbox
- **Scheduled Exports**: Automated periodic reports
- **Template System**: Custom report templates
- **Excel Format**: Native Excel file support
- **API Integration**: Export to external systems

## 📝 Notes

- All exports include proper timestamp and metadata
- CSV files use standard formatting for Excel compatibility
- PDF reports maintain professional appearance across devices
- Export options are persisted across sessions
- File naming follows consistent patterns with timestamps