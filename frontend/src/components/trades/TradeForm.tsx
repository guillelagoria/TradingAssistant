// Legacy TradeForm - now uses EnhancedTradeForm for better keyboard navigation
import React from 'react';
import EnhancedTradeForm from './EnhancedTradeForm';

interface TradeFormProps {
  tradeId?: string;
  onSuccess?: (trade: any) => void;
  onCancel?: () => void;
}

function TradeForm({ tradeId, onSuccess, onCancel }: TradeFormProps) {
  // Simply delegate to the enhanced version with keyboard navigation
  return (
    <EnhancedTradeForm
      tradeId={tradeId}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}

export default TradeForm;