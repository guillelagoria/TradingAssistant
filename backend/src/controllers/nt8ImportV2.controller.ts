import { Request, Response } from 'express';
import { NT8ImportServiceV2 } from '../services/nt8ImportV2.service';

// Extend Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

const importService = new NT8ImportServiceV2();

export class NT8ImportV2Controller {
  /**
   * Preview import - parse and validate without saving
   */
  async preview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const userId = req.userId || req.user?.id;
      const accountId = req.body.accountId || req.user?.defaultAccountId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!accountId) {
        res.status(400).json({ error: 'Account ID is required' });
        return;
      }

      const preview = await importService.previewImport(fileContent, userId, accountId);

      // Format response with clear error messages
      const data = {
        totalTrades: preview.total,
        validTrades: preview.valid,
        duplicates: preview.duplicates,
        errors: preview.errors,
        trades: preview.trades.map(t => ({
          rowNumber: t.rowNumber,
          trade: t.trade,
          isValid: t.validation.isValid,
          isDuplicate: t.validation.isDuplicate,
          errors: t.validation.errors.map(e =>
            `Row ${t.rowNumber}: ${e.field} - ${e.message}`
          )
        }))
      };

      res.json({
        success: true,
        data,
        message: `Found ${preview.valid} valid trades, ${preview.duplicates} duplicates, ${preview.errors} errors`
      });
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({
        error: 'Failed to preview import',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute import - save valid trades to database
   */
  async execute(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const userId = req.userId || req.user?.id;
      const accountId = req.body.accountId || req.user?.defaultAccountId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!accountId) {
        res.status(400).json({ error: 'Account ID is required' });
        return;
      }

      const result = await importService.executeImport(fileContent, userId, accountId);

      // Format response to match NT8ExecuteResponse interface
      res.json({
        success: true,
        data: {
          imported: result.imported,
          skipped: result.duplicates,
          errors: result.errors,
          message: `Successfully imported ${result.imported} trade${result.imported !== 1 ? 's' : ''}${result.duplicates > 0 ? `, ${result.duplicates} duplicate${result.duplicates !== 1 ? 's' : ''} skipped` : ''}`
        },
        message: `Import completed: ${result.imported} imported, ${result.duplicates} skipped, ${result.errors} errors`
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({
        error: 'Failed to execute import',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const nt8ImportV2Controller = new NT8ImportV2Controller();